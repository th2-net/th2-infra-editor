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
		pins: Array<Pin>;
		params?: Array<{
			name: string;
			value: string | number | boolean;
		}>;
		['image-name']: string;
		['image-version']: string;
		['node-port']: number;
		['dictionaries-relation']?: Array<DictionaryRelation>;
	};
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

export interface DictionaryRelation {
	name: string;
	box: string;
	dictionary: {
		name: string;
		type: string;
	};
}
