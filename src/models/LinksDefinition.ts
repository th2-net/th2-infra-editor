/** *****************************************************************************
 *  Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ***************************************************************************** */

import FileBase from './FileBase';

export default interface LinksDefinition extends FileBase {
	spec: {
		['links-definition']?: {
			['router-mq']: Router<MqConnection>[];
			['router-grpc']: Router<GrpcConnection>[];
		};
		['boxes-relation']?: {
			['router-mq']: Router<MqConnection>[];
			['router-grpc']: Router<GrpcConnection>[];
		};
	};
}

export interface Router<T extends MqConnection | GrpcConnection> {
	name: string;
	from: T;
	to: T;
}

export interface MqConnection {
	box: string;
	pin: string;
}

export interface GrpcConnection {
	box: string;
	pin?: string;
	strategy?: string;
	['service-class']?: string;
}

export function isLinksDefinition(file: FileBase): file is LinksDefinition {
	try {
		const b = file as LinksDefinition;
		if (b.spec['links-definition']) {
			return [
				Array.isArray(b.spec['links-definition']['router-grpc']),
				Array.isArray(b.spec['links-definition']['router-mq']),
			].every(Boolean);
		}
		if (b.spec['boxes-relation']) {
			return [
				Array.isArray(b.spec['boxes-relation']['router-grpc']),
				Array.isArray(b.spec['boxes-relation']['router-mq']),
			].every(Boolean);
		}
		return false;
	} catch (e) {
		return false;
	}
}
