/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import { Router, MqConnection, GrpcConnection, Link } from '../models/LinksDefinition';

export function convertLinks(
	connections: Router<MqConnection | GrpcConnection>[],
	connectionType: 'mq' | 'grpc',
): Link[] {
	return connections.map(mqLink => ({
		name: mqLink.name,
		from: {
			box: mqLink.from.box,
			pin: mqLink.from.pin,
			connectionType,
		},
		to: {
			box: mqLink.to.box,
			pin: mqLink.to.pin,
			connectionType,
		},
	}));
}
