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

import { BoxEntity } from '../models/Box';
import LinksDefinition from '../models/LinksDefinition';
import FileBase from '../models/FileBase';

export default class Api {
	async fetchSchemasList(): Promise<string[]> {
		const res = await fetch('schemas');

		if (!res.ok) {
			console.error(`Can't fetch schemas list - ${res.statusText}`);
			return [];
		}

		return res.json();
	}

	async fetchSchemaState(schemaName: string): Promise<FileBase[]> {
		const res = await fetch(`schema/${schemaName}`);

		if (!res.ok) {
			console.error(`Can't fetch schema state - ${res.statusText}`);
			return [];
		}

		return res.json();
	}
}
