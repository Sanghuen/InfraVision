import docker


def get_docker_containers():
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)

        return [
            {
                "id": container.short_id,
                "name": container.name,
                "status": container.status,
                "image": (
                    container.image.tags[0]
                    if container.image.tags
                    else None
                ),
                "ports": container.attrs.get("NetworkSettings", {}).get(
                    "Ports", {}
                ),
            }
            for container in containers
        ]

    except docker.errors.DockerException as error:
        print(f"Unable to connect to Docker: {error}")
        # The Backend DTO expects docker to always be an array.
        return []
