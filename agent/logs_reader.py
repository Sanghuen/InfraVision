import json
import os
import shutil
import subprocess
import zlib
from datetime import datetime, timezone

# Windows Event Log support is optional so the Agent can also run on Linux.
if os.name == "nt":
    import win32evtlog
    import win32evtlogutil
    import win32con
else:
    win32evtlog = None
    win32evtlogutil = None
    win32con = None


LOG_CHANNELS = ["Application", "System"]
MAX_EVENTS = 50
_last_record_ids = {}


def get_event_level(event_type):
    if win32con is None:
        return "info"

    levels = {
        win32con.EVENTLOG_ERROR_TYPE: "error",
        win32con.EVENTLOG_WARNING_TYPE: "warning",
        win32con.EVENTLOG_INFORMATION_TYPE: "info",
        win32con.EVENTLOG_AUDIT_SUCCESS: "info",
        win32con.EVENTLOG_AUDIT_FAILURE: "warning",
    }

    return levels.get(event_type, "info")


def read_event_logs(channel, max_events=MAX_EVENTS):
    if os.name != "nt":
        return []

    logs = []
    handle = None

    try:
        handle = win32evtlog.OpenEventLog(None, channel)
        flags = (
            win32evtlog.EVENTLOG_BACKWARDS_READ
            | win32evtlog.EVENTLOG_SEQUENTIAL_READ
        )
        events = win32evtlog.ReadEventLog(handle, flags, 0)

        if not events:
            return logs

        latest_record_id = _last_record_ids.get(channel)
        if latest_record_id is None:
            selected_events = events[:max_events]
        else:
            selected_events = [
                event for event in events
                if event.RecordNumber > latest_record_id
            ]

        new_record_ids = []

        for event in selected_events:
            try:
                source = event.SourceName
                event_id = event.EventID & 0xFFFF

                try:
                    message = win32evtlogutil.SafeFormatMessage(event, channel)
                except Exception:
                    message = "Unable to format event message"

                timestamp = datetime.fromtimestamp(
                    event.TimeGenerated.timestamp(),
                    tz=timezone.utc,
                ).isoformat()

                logs.append({
                    "recordId": event.RecordNumber,
                    "timestamp": timestamp,
                    "level": get_event_level(event.EventType),
                    "source": source,
                    "eventId": event_id,
                    "channel": channel,
                    "message": message.strip(),
                })
                new_record_ids.append(event.RecordNumber)
            except Exception:
                continue

        if new_record_ids:
            _last_record_ids[channel] = max(new_record_ids)

    except Exception as error:
        print(f"Failed to read {channel} logs: {error}")

    finally:
        if handle:
            win32evtlog.CloseEventLog(handle)

    return logs


def _journal_level(priority):
    try:
        priority = int(priority)
    except (TypeError, ValueError):
        return "info"

    if priority <= 3:
        return "error"
    if priority == 4:
        return "warning"
    return "info"


def _journal_timestamp(value):
    try:
        # systemd journal timestamps are Unix microseconds.
        timestamp = int(value) / 1_000_000
        return datetime.fromtimestamp(
            timestamp,
            tz=timezone.utc,
        ).isoformat()
    except (TypeError, ValueError, OSError, OverflowError):
        return datetime.now(timezone.utc).isoformat()


def read_linux_journal(max_events=MAX_EVENTS):
    journalctl = shutil.which("journalctl")
    if not journalctl:
        print("Linux Logs unavailable: journalctl was not found.")
        return []

    try:
        result = subprocess.run(
            [
                journalctl,
                "--no-pager",
                "--output=json",
                "-n",
                str(max_events),
            ],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"Failed to read Linux journal: {error}")
        return []

    if result.returncode != 0:
        detail = result.stderr.strip() or f"exit code {result.returncode}"
        print(f"Failed to read Linux journal: {detail}")
        return []

    logs = []
    for line in result.stdout.splitlines():
        try:
            entry = json.loads(line)
            cursor = str(entry.get("__CURSOR") or "")
            identity = cursor or "|".join([
                str(entry.get("__REALTIME_TIMESTAMP", "")),
                str(entry.get("_BOOT_ID", "")),
                str(entry.get("_PID", "")),
                str(entry.get("MESSAGE", "")),
            ])
            # The existing database schema uses an integer recordId.
            # A stable 31-bit hash lets duplicate journal entries be ignored
            # by the existing (serverId, channel, recordId) unique constraint.
            record_id = zlib.crc32(identity.encode("utf-8")) & 0x7FFFFFFF

            message = entry.get("MESSAGE", "")
            if isinstance(message, list):
                message = " ".join(str(part) for part in message)

            source = (
                entry.get("SYSLOG_IDENTIFIER")
                or entry.get("_COMM")
                or entry.get("_SYSTEMD_UNIT")
                or "systemd-journal"
            )

            logs.append({
                "recordId": record_id,
                "timestamp": _journal_timestamp(
                    entry.get("__REALTIME_TIMESTAMP")
                ),
                "level": _journal_level(entry.get("PRIORITY")),
                "source": str(source),
                "eventId": 0,
                "channel": "Journal",
                "message": str(message),
            })
        except (json.JSONDecodeError, TypeError, ValueError):
            continue

    logs.sort(key=lambda item: item["timestamp"], reverse=True)
    return logs


def get_system_logs():
    """Collect platform-native system logs for Windows or Linux."""
    if os.name == "nt":
        logs = []
        for channel in LOG_CHANNELS:
            logs.extend(read_event_logs(channel))
        logs.sort(key=lambda item: item["timestamp"], reverse=True)
        return logs

    return read_linux_journal()
