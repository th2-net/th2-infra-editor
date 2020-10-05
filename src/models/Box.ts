import { DictionaryRelation } from './Dictionary';
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
import FileBase from './FileBase';

export interface BoxEntity extends FileBase {
	spec: {
		['custom-config']?: {
			[prop: string]: string;
		};
		['image-name']: string;
		['image-version']: string;
		['node-port']?: number;
		['dictionaries-relation']?: Array<DictionaryRelation>;
		data?: string;
		pins: Array<Pin>;
	};
}

export interface BoxEntityWrapper {
	box: BoxEntity;
	direction: 'left' | 'right';
}

export interface Pin {
	attributes: Array<string>;
	['connection-type']: string;
	filters?: Array<Filter>;
	name: string;
}

export interface Filter {
	metadata: {
		['field-name']: string;
		['expected-value']: string;
		['operation']: string;
	}[];
}

export interface BoxConnections {
	leftConnection: Connection;
	rightConnection: Connection;
}

export interface Connection {
	connectionOwner: ConnectionOwner;
	left: number;
	top: number;
}

export interface ConnectionOwner {
	box: string;
	pin: string;
	connectionType: string;
}

export interface ConnectionArrow {
	name: string;
	start: Connection;
	end: Connection;
}

export function isBoxEntity(object: unknown): object is BoxEntity {
	return (typeof object === 'object'
		&& object !== null
		&& (object as BoxEntity).kind !== undefined)
		&& (object as BoxEntity).spec['image-name'] !== undefined;
}
