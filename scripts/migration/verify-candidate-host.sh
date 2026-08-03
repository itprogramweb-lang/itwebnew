#!/usr/bin/env bash
set -euo pipefail

run_if_exists() {
  local label="$1"
  shift

  if command -v "$1" >/dev/null 2>&1; then
    echo "== $label =="
    "$@" || true
    echo
  else
    echo "== $label =="
    echo "UNAVAILABLE: $1"
    echo
  fi
}

echo "== Timestamp =="
date || true
echo

echo "== OS Release =="
if [ -f /etc/os-release ]; then
  cat /etc/os-release
else
  uname -a || true
fi
echo

run_if_exists "CPU" lscpu

echo "== CPU Fallback =="
getconf _NPROCESSORS_ONLN 2>/dev/null || true
echo

if command -v free >/dev/null 2>&1; then
  echo "== Memory =="
  free -h || true
  echo
elif [ -f /proc/meminfo ]; then
  echo "== Memory =="
  head -n 5 /proc/meminfo || true
  echo
fi

run_if_exists "Disk Usage" df -h
run_if_exists "Docker Version" docker --version

echo "== Docker Info =="
if command -v docker >/dev/null 2>&1; then
  docker info 2>/dev/null || echo "Docker available but info command failed"
else
  echo "UNAVAILABLE: docker"
fi
echo

echo "== Docker Compose Version =="
if command -v docker >/dev/null 2>&1; then
  docker compose version 2>/dev/null || echo "Docker Compose plugin unavailable"
else
  echo "UNAVAILABLE: docker"
fi
echo

if command -v ss >/dev/null 2>&1; then
  echo "== Listening Ports =="
  ss -tulpn || true
  echo
elif command -v netstat >/dev/null 2>&1; then
  echo "== Listening Ports =="
  netstat -tulpn || true
  echo
else
  echo "== Listening Ports =="
  echo "UNAVAILABLE: ss/netstat"
  echo
fi

echo "== Time Synchronization =="
if command -v timedatectl >/dev/null 2>&1; then
  timedatectl status || true
else
  date || true
fi
echo