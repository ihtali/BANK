# Use a multi-stage build to reduce the size of the final image.
#   This example is optimized to reduce final image size rather than for simplicity.
# Using a -slim image also greatly reduces image size.
# It is possible to use -alpine images instead to further reduce image size, but this comes
# with several important caveats.
#   - Alpine images use MUSL rather than GLIBC (as used in the default Debian-based images).
#   - Most Python packages that require C code are tested against GLIBC, so there could be
#     subtle errors when using MUSL.
#   - These Python packages usually only provide binary wheels for GLIBC, so the packages
#     will need to be recompiled fully within the container images, increasing build times.
# ============================================================
# BUILD IMAGE
# ============================================================
FROM python:3.12-slim-bookworm AS python_builder

# Nexus credentials passed from docker-compose args
ARG PYPI_USER
ARG PYPI_PASSWORD
ARG PYPI_HOST

ENV PYPI_USER=${PYPI_USER}
ENV PYPI_PASSWORD=${PYPI_PASSWORD}
ENV PYPI_HOST=${PYPI_HOST}

# Python-friendly environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV WORKDIR=/src
WORKDIR ${WORKDIR}

# ------------------------------------------------------------
# Install prerequisites
# ------------------------------------------------------------
RUN apt-get update && apt-get install -y curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------
# Install uv
# ------------------------------------------------------------
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# ------------------------------------------------------------
# Create virtual environment
# ------------------------------------------------------------
RUN uv venv /opt/venv
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# ------------------------------------------------------------
# Install dependencies
# ------------------------------------------------------------
COPY requirements.txt .

# Change this: Removed "/repository/sandbox" from the string 
# because your PYPI_HOST variable already includes it.
RUN uv pip install --no-cache -r requirements.txt \
    --index-url https://${PYPI_USER}:${PYPI_PASSWORD}@${PYPI_HOST}/simple/ \
    --extra-index-url https://pypi.org/simple \
    --trusted-host nexus.openconsultinguk.com
# Copy source code
# ------------------------------------------------------------
COPY src ./src
COPY my_agent ./my_agent
COPY README.md ./

# ============================================================
# FINAL RUNTIME IMAGE
# ============================================================
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

ENV HOME=/home/user
ENV APP_HOME=${HOME}/app

RUN mkdir -p ${APP_HOME}

# Create non-root user
RUN groupadd -r user && \
    useradd -r -g user -d ${HOME} -s /sbin/nologin -c "Container user" user

WORKDIR ${APP_HOME}

# Copy the environment and the source code
COPY --from=python_builder ${UV_PROJECT_ENVIRONMENT} ${UV_PROJECT_ENVIRONMENT}
COPY --from=python_builder /src/src ${APP_HOME}/src
COPY --from=python_builder /src/my_agent ${APP_HOME}/my_agent
COPY --from=python_builder /src/README.md ${APP_HOME}

# Set Paths
ENV PATH="${UV_PROJECT_ENVIRONMENT}/bin:${PATH}"
# This tells python to look for 'api.main' inside the src folder
# This tells python to look in the root app folder AND the src folder
ENV PYTHONPATH="${APP_HOME}:${APP_HOME}/src"
RUN chown -R user:user ${APP_HOME}

# Run as non-root
USER user

# Entrypoint is handled by docker-compose (uvicorn)