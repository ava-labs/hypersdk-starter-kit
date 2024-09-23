#!/usr/bin/env bash
# Copyright (C) 2023, Ava Labs, Inc. All rights reserved.
# See the file LICENSE for licensing terms.

set -o errexit
set -o nounset
set -o pipefail

# Get the directory of the script, even if sourced from another directory
SCRIPT_DIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)

# shellcheck source=/scripts/common/build.sh
source "$SCRIPT_DIR"/common/build.sh
# shellcheck source=/scripts/constants.sh
source "$SCRIPT_DIR"/constants.sh
# Construct the correct path to morpheusvm directory
MORPHEUSVM_PATH=$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  cd .. && pwd
)

build_project "$MORPHEUSVM_PATH" "cfmmvm" "WdSWVHBL2fsqAxFwFJ5Se35zL4JmRBN6KLK19XuVJ6tv3hRQf"