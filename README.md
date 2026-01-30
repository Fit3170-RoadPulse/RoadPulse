# RoadPulse

## Table of Contents



- [Overview](#overview)
- [Handover Documentation] (# Handover Documentation)
- [Features](#features)
- [License](#license)
- [Team Structure](#team-structure)
  - [Agile Subteams](#agile-subteams)
  - [Specialist-role Teams](#specialist-role-teams)
---


## Handover Documentation 

Introduction:

This document details the system requirements and setup instructions for the RoadPulse project. Comprehensive instructions have been provided as this guide assumes a fresh PC with none of the components installed. The steps from section 1 to section 3 should be followed in order as some parts of the software have dependencies that are installed in previous sections.

While instructions and pictures have been provided, this guide also assumes that the executors are familiar with technical jargon and concepts, even if they might not be familiar with the specific software used in this project (Docker, VSCOde, Python, etc.). 

Finally, we have included a section for tips and common troubleshooting for the developers at the end of this document. We hope this guide is of use to future developers! 

# 1.0 Requirements
1.1 Hardware Requirements
Processor: Quad-core 2.4GHz
RAM: 16GB minimum recommended (Django, React and PostGIS simultaneously can consume 8-10GB of RAM)
Storage: 20GB of free space (for Docker images and volumes)
1.2 System Requirements
Git
Docker Desktop
To run containers (PostGIS, Python, React)
VS Code
IDE
1.3 Recommended VS Code Extensions (but not required)
Dev Containers
Allow open project folder inside Docker container, so VS Code do not use the Python locally but uses the Python version inside the container
Python
Prettier
For React formatting
Docker
Manage containers directly from VS Code sidebar

# 2.0 Installation of required components
2.1 Git
Go to https://git-scm.com/install/windows
Select your computer’s operating system and click the link at the top to download the latest version:

Follow the steps in the installation wizard. Default settings are fine. 


2.2 Docker Desktop
Go to https://www.docker.com/
Press ‘Download Docker Desktop’ and select your computer’s operating system:

Follow the steps in the installation wizard. Default settings are fine. 
2.3 VS Code
Go to https://code.visualstudio.com/
Download the model according to your computer’s operating system:
The large button directly downloads the installer, but you can use the other version if you like.

Follow the steps in the installation wizard. Default settings are fine. 

# 3.0 Project Setup
Note: Paste with Ctrl + Shift + C then press enter

Open Docker Desktop
Open VS Code
Go to VS Code
Press ‘Clone Repository’

Paste ‘https://github.com/Fit3170-RoadPulse/RoadPulse.git’

Press Enter
Select the file path that you want to place this repository
Install the recommended extensions


Open terminal
Paste this command ‘docker-compose up --build -d’ and press enter
Wait until it completed
Paste this command ‘docker-compose exec backend python manage.py migrate’ and press enter
Wait until it completed
Paste this command  ‘docker-compose exec backend python manage.py createsuperuser’ and press enter
Type in the username, email and password you prefer (This can be used to login in the admin page of Django: http://localhost:8000/admin)


Congratulations! The setup is complete


# 4.0 Tips and common troubleshooting
4.1 Common Error
4.1.1 Error "package' could not be resolved"

Troubleshoot:
Ensure the package is properly installed in your active Python environment. (Refer to 1.1 if not installed)
Install the required package. (Run: pip install “package name”)
Check your python environment. (Virtual environments)
Make sure to activate your virtual environment (Eg. venv) before running the docker.
On macOS/Linux. (Run:  source venv/bin/activate)
On Windows (Command Prompt). (Run: venv\Scripts\activate)
Install dependencies from requirements.txt. (Run: pip install -r requirements.txt)
Verify package installation. (Run: pip show <package_name> or pip list)
Rebuild docker image.
Stop running containers. (Run: docker-compose down)
Rebuild the image without cache to ensure dependencies are installed. (Run: docker-compose build --no-cache)
Start the container. (Run: docker-compose up)
If issues persist, try selecting the correct python interpreter.
Press Command + Shift + P (macOS) or Ctrl + Shift + P (Windows/Linux).
Search for “Python: Select Interpreter”.
Select the project’s virtual environment. (e.g. venv)
Restart the terminal and rerun the application after selecting the interpreter.
4.1.2  Docker Container not running
Troubleshoot:
Check container status.
List all containers including the stopped ones. (Run: docker ps -a)
Look for container status. (Eg. Exited)
Note the container name.
Inspect the container logs for startup or runtime errors. (Run: docker logs “container name”)
Check container exit code.
Identify the reason the container stopped. (Run: docker inspect “container name”
If exit code = 0. (Container exited normally)
If exit code \= 0. (Container terminated due to an error)
Restart the container. (Run: docker restart “container name”)
If the container stops again, proceed to the next step.
Validate image and build.
Confirm the container image exists and is built correctly. (Run: docker images)
If required, rebuild the image. (Run: docker build -t “image name”)
Verify container configuration.
Check and ensure environment variables are defined. (Run: docker inspect “container name”)
Verify and ensure exposed ports are correctly mapped to the host.
Verify and ensure volume mounted parts exist and are accessible.
Check resource constraints.
Check if the container was terminated due to insufficient memory. (Run: docker inspect “container name”)
Review State.00MKilled
Monitor system resource usage. (Run: docker stats)
Validate entry point and command.
Inspect entrypoint and command. (Run: docker inspect “image name”)
Confirm that the startup command exists and is executable.
Run the container interactively for debugging if needed. (Run: docker run -it --entrypoint sh “image name”)
Check application dependencies and networking.
Ensure dependent services (Eg. database, cache) are running.
Verify docker network configuration. 
Run: docker network ls
Run: docker network inspect "network name"
Confirm connectivity between containers if applicable.
Review Docker Daemon logs.
Check docker engine logs for errors. (Review via docker desktop application)
Clean up and re-deploy
Remove the stopped container. (docker rm “container name”)
Recreate the container using the correct image and configuration.
Remove unused Docker resources if conflicts are suspected. (Run: docker system prune)
Docker compose.
Validate compose configuration. (Run: docker compose config)
Restart services with a clean build.
Run: docker compose down
Run: docker compose up -d --build
Review service logs. (Run: docker compose logs "service name")

# 5.0 How to deploy this project
To deploy RoadPulse for future releases, the recommended approach is to use Render. Follow these steps:
Open https://render.com and press Get Started.
Create a Render account.
Press New Service and select Web Service.
Connect the service to the project repository on GitLab.
Enter a name for the web service.
Choose the runtime environment (Docker is recommended).
Select the branch to deploy (e.g., main or Testing).
Select the nearest region to your target users.
Enter the root directory for deployment (frontend or backend).
Choose the plan (the free plan is sufficient for testing/development).
Enter all required environment variables (e.g., API keys).
Press Deploy Web Service and wait for the deployment to complete.
After deployment, Render provides a live URL where the web service can be accessed. Any future updates should follow the Pull Request strategy to ensure code quality before redeploying.

# 6.0 Summary of information for new developers
This section provides key points for new developers joining the RoadPulse project:
Repository Access: The project is hosted on GitHub. All development must follow the branch and Pull Request strategy.


Development Environment: Docker is used for both backend and frontend services. Use VS Code with recommended extensions (Python, Dev Containers, Docker, Prettier).


Project Setup: Follow the setup steps to run the project locally, including docker-compose up --build -d, database migrations, and creating a superuser.


Coding Standards: Follow the agreed naming conventions, indentation, and documentation style for functions, classes, and modules.


Testing: Unit and integration tests should be run locally before opening Pull Requests. QA validation is performed on the Testing branch.


Versioning and Releases: Semantic Versioning is used to tag all future releases in GitHub (MAJOR.MINOR.PATCH).


Deployment: Render is used for hosting. Developers should ensure code is tested and merged via Pull Requests before deploying.


Support Resources: Refer to troubleshooting tips in Section 4 for common issues related to Docker, Python packages, and environment setup.


This summary ensures new developers can quickly get the project running, understand the workflow, and follow best practices for contributing to RoadPulse.

# 7.0 Versioning Strategy and Pull Strategy
7.1.1 Versioning Strategy
RoadPulse will use Semantic Versioning (SemVer) for all future releases. Each release should tag in GitHub using the format MAJOR.MINOR.PATCH (e.g.,v1.0.0):
MAJOR – for breaking or incompatible changes


MINOR – for new features added without breaking existing functionality


PATCH – for bug fixes and minor improvements


All releases should be tagged only after code has been fully implemented, tested, and merged. Version tags provide a clear reference for stable releases and make it easier for future developers to track changes or roll back if needed.

7.1.2 Pull Strategy
For future releases of RoadPulse, all code contributions must be submitted through Pull Requests (PRs). Developers are required to create a new branch from the appropriate base branch and complete all development work within that branch. Direct commits to the main branch are not allowed to ensure code stability and proper review.
Once development is complete, a Pull Request should be opened with a clear title and a brief summary of the changes made. Each Pull Request must be reviewed and approved by at least one team member before merging. Any requested changes must be addressed, and the working branch should be deleted after the merge to keep the repository clean and maintainable.
Example: Feature Implementation
A developer implements a new feature for real-time traffic reporting.
Branch created:
 real-time-traffic-reporting/AT1/US3/create-traffic-report
Developer completes the feature and runs relevant unit and integration tests locally.
A Pull Request is opened targeting the Testing branch.
PR title:
 [Sprint 2 US3 – REAL-TIME TRAFFIC REPORT] Implement traffic report submission
PR description includes:


Summary of changes
Reference to User Story US3
Confirmation that tests were run successfully
The Pull Request is reviewed by at least one team member.
After approval, the PR is merged into the Testing branch for QA validation.


---

## Overview

RoadPulse provides a community-driven traffic monitoring and navigation system that combines crowdsourced reports, GPS, and AI predictions to give drivers accurate real-time updates and incentivises participation with a reward system.

---

## Features

- **Real-Time Traffic Reporting**
- **AI-Powered Traffic Predictions**
- **User Collaboration & Rewards**
- **GPS Tracking & Navigation**
- **Emergency & Public Services Integration**

---


## Team Structure

### Agile Subteams

| Agile 1 (Project Manager: Hiew Jing Hong) | Agile 2 (Project Manager: Kieran Antonio) |
| :---------------------------------------- | :---------------------------------------- |
| Hiew Jing Hong (PM1)                      | Kieran Antonio (PM2)                      |
| Nabiel Rasyiqi                            | Alamgir Ghazanfar Ali                     |
| Danny Yan                                 | Jadon                                     |
| Wong Xin Thung                            | Tang Ming Ze                              |
| Guan Yi Lian                              | Zi You Lim                                |

---

### Specialist-role Teams

**Product Management (PMs):**
- Hiew Jing Hong
- Kieran Antonio

**Agile Release Train Engineers (RTEs):**
- Nabiel Rasyiqi
- Alamgir Ghazanfar Ali
- Tang Ming Ze
- Wong Xin Thung

**System Architects (SAs):**
- Guan Yi Lian
- Jadon
- Danny Yan
- Zi You Lim

---

## License

[Click here](LICENSE)

---