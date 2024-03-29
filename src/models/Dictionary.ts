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

export interface MultiDictionary {
	name: string;
	alias: string;
}
export interface DictionaryRelation {
	name: string;
	box: string;
	dictionary: {
		name: string;
		type: string;
	};
}

export interface MultiDictionaryRelation {
	name: string;
	box: string;
	dictionaries: {
		name: string;
		alias: string;
	}[];
}

export interface DictionaryEntity extends FileBase {
	name: string;
	kind: string;
	spec: {
		data: string;
	};
}

export interface DictionaryLinksEntity extends FileBase {
	name: string;
	kind: string;
	spec: {
		['dictionaries-relation']: DictionaryRelation[];
		['multi-dictionaries-relation']: MultiDictionaryRelation[];
	};
}

export function isDictionaryEntity(file: unknown): file is DictionaryEntity {
	return typeof file === 'object' && file !== null && (file as FileBase).kind === 'Th2Dictionary';
}

export function isDictionaryLinksEntity(file: unknown): file is DictionaryLinksEntity {
	return (
		typeof file === 'object' &&
		file !== null &&
		(file as DictionaryLinksEntity).spec['dictionaries-relation'] !== undefined
	);
}
