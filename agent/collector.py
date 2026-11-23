
from cpu_reader import get_cpu_info
from memory_reader import get_memory_info
from disk_reader import get_disk_info
from process_reader import get_processes
from docker_reader import get_docker_containers
from network_reader import get_network_info
from logs_reader import get_system_logs
from sender import send_metrics

import platform
import socket
import json
import time

from datetime import datetime, timezone


# Collection interval (seconds)
COLLECTION_INTERVAL = 15


def collect_system_info():
    return {
        "agent": {
            "hostname": socket.gethostname(),
            "platform": platform.system(),
            "platform_version": platform.version(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "cpu": get_cpu_info(),
        "memory": get_memory_info(),
        "disk": get_disk_info(),
        "network": get_network_info(),
        "processes": get_processes(),
        "docker": get_docker_containers(),
        "logs": get_system_logs(),
    }


def run_agent():
    print("=" * 50)
    print("InfraVision Agent Started")
    print(f"Collection interval: {COLLECTION_INTERVAL} seconds")
    print("Press Ctrl+C to stop")
    print("=" * 50)

    while True:
        cycle_start = time.time()

        try:
            print("\nCollecting system information...")

            data = collect_system_info()

            print("Sending metrics to Backend...")

            response = send_metrics(data)

            print("Backend Response:")
            print(json.dumps(response, indent=2))

            print(
                f"Collection completed at "
                f"{datetime.now().astimezone().isoformat()}"
            )

        except Exception as error:
            print(f"Agent Error: {error}")
            print("Will retry in the next cycle.")

        elapsed = time.time() - cycle_start
        sleep_time = max(0, COLLECTION_INTERVAL - elapsed)

        print(f"Next collection in {sleep_time:.1f} seconds")

        try:
            time.sleep(sleep_time)
        except KeyboardInterrupt:
            raise


if __name__ == "__main__":
    try:
        run_agent()

    except KeyboardInterrupt:
        print("\nInfraVision Agent stopped.")
