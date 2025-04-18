
# Huginn Docker Setup

This is an automated setup for Huginn using Docker. The official Huginn Docker image is used.

## Starting Huginn

Run the following command to start Huginn:

```
docker-compose up -d
```

## Accessing Huginn

Once started, Huginn will be available at:

http://localhost:3000

The default login is:
- Username: admin
- Password: password

Make sure to change these credentials after first login.

## Stopping Huginn

To stop Huginn, run:

```
docker-compose down
```

## Configuration

You can customize Huginn by modifying environment variables in the docker-compose.yml file.
