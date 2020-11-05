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

import { action, observable, reaction } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { rightJoin } from '../helpers/array';
import { BoxEntity, isBoxEntity } from '../models/Box';
import {
	DictionaryEntity,
	DictionaryLinksEntity,
	isDictionaryEntity,
	isDictionaryLinksEntity,
} from '../models/Dictionary';
import LinksDefinition, { isLinksDefinition } from '../models/LinksDefinition';
import ConnectionsStore from './ConnectionsStore';
import RootStore from './RootStore';
import SchemasStore from './SchemasStore';

enum Events {
	StatusUpdate = 'statusUpdate',
	RepositoryUpdate = 'repositoryUpdate',
}

export default class SubscriptionStore {
	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		private schemasStore: SchemasStore,
		private connectionsStore: ConnectionsStore,
		schemaName: string,
	) {
		if (schemasStore.schemaSettings?.spec['k8s-propagation'] === 'true') {
			this.init(schemaName);
		}

		reaction(
			() => schemasStore.schemaSettings?.spec['k8s-propagation'],
			propagation => propagation === 'true' && this.init(schemaName),
		);
	}

	@observable
	private subscription: EventSource | null = null;

	@observable
	public isSubscriptionSuccessfull = false;

	@observable
	public isConnectionOpen = false;

	@observable
	public boxStates = new Map<string, 'Running' | 'Pending' | 'Failed'>();

	@observable
	private isReconnecting = false;

	@action
	public closeConnection = () => {
		this.subscription?.close();
	};

	schemaAbortController: AbortController | null = null;

	private fetchChanges = async () => {
		if (!this.schemasStore.selectedSchema) return;
		if (this.schemaAbortController) {
			this.schemaAbortController.abort();
		}
		this.schemaAbortController = new AbortController();

		const result = await this.api.fetchSchemaState(
			this.schemasStore.selectedSchema,
			this.schemaAbortController.signal,
		);

		const boxes = result.resources.filter(resItem => isBoxEntity(resItem)) as BoxEntity[];

		const addedBoxes = rightJoin(
			this.schemasStore.boxes.map(box => box.name),
			boxes.map(box => box.name),
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		).map(boxName => boxes.find(box => box.name === boxName)!);

		const deletedBoxes = rightJoin(
			boxes.map(box => box.name),
			this.schemasStore.boxes.map(box => box.name),
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		).map(boxName => this.schemasStore.boxes.find(box => box.name === boxName)!);

		const changedBoxes = boxes.filter(
			box =>
				!this.schemasStore.boxes.find(
					changedBox =>
						changedBox.name === box.name && changedBox.sourceHash === box.sourceHash,
				),
		);

		addedBoxes.forEach(box => this.schemasStore.addBox(box));
		deletedBoxes.forEach(box => this.schemasStore.deleteBox(box.name, false));
		changedBoxes.forEach(box =>
			this.schemasStore.configurateBox(box, {
				createSnapshot: false,
			}),
		);

		const links = result.resources.filter(resItem =>
			isLinksDefinition(resItem),
		) as LinksDefinition[];
		if (links[0].sourceHash !== this.connectionsStore.linkBox?.sourceHash) {
			this.connectionsStore.linkBox = links[0];
			this.connectionsStore.setLinks(links);
		}

		const dictionaryList = result.resources.filter(resItem =>
			isDictionaryEntity(resItem),
		) as DictionaryEntity[];
		if (
			dictionaryList.some(
				targetDictionary =>
					!this.schemasStore.dictionaryList.find(
						dictionary => dictionary.sourceHash === targetDictionary.sourceHash,
					),
			) ||
			this.schemasStore.dictionaryList.some(targetDictionary =>
				dictionaryList.find(
					dictionary => dictionary.sourceHash === targetDictionary.sourceHash,
				),
			)
		) {
			this.schemasStore.dictionaryList = dictionaryList;
		}

		const dictionaryLinksEntity = (result.resources.filter(resItem =>
			isDictionaryLinksEntity(resItem),
		) as DictionaryLinksEntity[])[0];
		if (
			dictionaryLinksEntity.sourceHash !== this.schemasStore.dictionaryLinksEntity?.sourceHash
		) {
			this.schemasStore.setDictionaryLinks(dictionaryLinksEntity);
		}
	};

	@action
	async init(schemaName: string) {
		this.subscription = this.api.subscribeOnChanges(schemaName);

		this.subscription.onopen = () => {
			this.isSubscriptionSuccessfull = true;
			this.isConnectionOpen = true;
			if (this.isReconnecting) {
				this.fetchChanges();
				this.isReconnecting = false;
			}
		};

		this.subscription.onerror = e => {
			if (this.subscription?.readyState !== EventSource.CONNECTING) {
				console.error(e);
			}
			this.isConnectionOpen = false;
			this.isReconnecting = true;
		};

		this.subscription.addEventListener(Events.StatusUpdate, e => {
			const messageData = JSON.parse((e as MessageEvent).data);
			this.boxStates.set(messageData.name, messageData.status);
		});

		this.subscription.addEventListener(Events.RepositoryUpdate, () => {
			this.fetchChanges();
		});
	}
}
