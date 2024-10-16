#!/bin/bash
#
# This file is part of symfinder.
#
# symfinder is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# symfinder is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with symfinder. If not, see <http://www.gnu.org/licenses/>.
#
# Copyright 2018-2021 Johann Mortara <johann.mortara@univ-cotedazur.fr>
# Copyright 2018-2021 Xhevahire Tërnava <t.xheva@gmail.com>
# Copyright 2018-2021 Philippe Collet <philippe.collet@univ-cotedazur.fr>
#
# This script builds the images to be used with docker

set -e
TAG=local

cd varicity
echo "Building VariCity-TS front"
docker build -t deathstar3/varicity-ts:${TAG} .

cd ../varicity-backend
echo "Building VariCity-TS backend"
docker build -t deathstar3/varicity-ts-backend:${TAG} .