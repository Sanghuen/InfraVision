import os

import psutil


def get_disk_info():
    preferred_root = "C:\\" if os.name == "nt" else os.path.abspath(os.sep)

    try:
        root_usage = psutil.disk_usage(preferred_root)
    except (PermissionError, OSError):
        root_usage = None

    partitions = []

    for partition in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(partition.mountpoint)

            partitions.append({
                "device": partition.device,
                "mountpoint": partition.mountpoint,
                "filesystem": partition.fstype,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "usage": usage.percent,
            })

            if root_usage is None:
                root_usage = usage

        except (PermissionError, OSError):
            continue

    if root_usage is None:
        root_usage = psutil.disk_usage(preferred_root)

    return {
        # Keep the summary fields consumed by the Dashboard.
        "total": root_usage.total,
        "used": root_usage.used,
        "usage": root_usage.percent,
        "partitions": partitions,
    }
