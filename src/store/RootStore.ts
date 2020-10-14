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

import ApiSchema from '../api/ApiSchema';
import HistoryStore from './HistoryStore';
import SchemasStore from './SchemasStore';

export default class RootStore {
	public schemaStore: SchemasStore;

	public historyStore: HistoryStore;

	constructor(private api: ApiSchema) {
		this.historyStore = new HistoryStore(this);
		this.schemaStore = new SchemasStore(this, this.api, this.historyStore);
	}

	async init() {
		await this.schemaStore.fetchSchemas();
		if (this.schemaStore.schemas.length) {
			this.schemaStore.setSelectedSchema(this.schemaStore.schemas[0]);
		}
	}
}
