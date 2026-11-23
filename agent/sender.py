import os
from urllib.parse import quote

import requests


def send_metrics(data):
    backend_url = os.getenv("INFRAVISION_BACKEND_URL", "").rstrip("/")
    server_id = os.getenv("INFRAVISION_SERVER_ID", "").strip()
    agent_key = os.getenv("INFRAVISION_AGENT_KEY", "").strip()

    missing = [
        name
        for name, value in (
            ("INFRAVISION_BACKEND_URL", backend_url),
            ("INFRAVISION_SERVER_ID", server_id),
            ("INFRAVISION_AGENT_KEY", agent_key),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing required InfraVision Agent configuration: "
            + ", ".join(missing)
            + ". Configure these values for this server before starting the Agent."
        )

    if not backend_url.startswith(("http://", "https://")):
        raise RuntimeError(
            "INFRAVISION_BACKEND_URL must start with http:// or https://."
        )

    url = f"{backend_url}/servers/{quote(server_id, safe='')}/metrics"

    try:
        response = requests.post(
            url,
            json=data,
            headers={"X-Agent-Key": agent_key},
            timeout=(5, 10),
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout as error:
        raise RuntimeError(f"Backend request timed out: {url}") from error
    except requests.exceptions.ConnectionError as error:
        raise RuntimeError(f"Cannot connect to Backend: {url}") from error
    except requests.exceptions.HTTPError as error:
        raise RuntimeError(
            f"Backend returned HTTP {response.status_code}: {response.text}"
        ) from error
