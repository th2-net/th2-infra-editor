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
import { isBoxEntity } from '../models/Box';
import { isDictionaryEntity, isDictionaryLinksEntity } from '../models/Dictionary';
import { isLinksDefinition } from '../models/LinksDefinition';
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
		reaction(
			() => schemasStore.schemaSettings,
			schemaSettings => {
				const propagation = schemaSettings?.spec['k8s-propagation'];
				if (propagation && ['sync', 'rule'].includes(propagation)) {
					this.init(schemaName);
				}
			},
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

		this.schemaAbortController?.abort();
		this.schemaAbortController = new AbortController();

		try {
			const result = await this.api.fetchSchemaState(
				this.schemasStore.selectedSchema,
				this.schemaAbortController.signal,
			);

			const boxes = result.resources.filter(isBoxEntity);

			const addedBoxes = boxes.filter(
				updatedBox =>
					this.schemasStore.boxes.findIndex(box => box.name === updatedBox.name) === -1,
			);

			const unsavedBoxes = this.schemasStore.preparedRequests
				.filter(request => isBoxEntity(request.payload) && request.operation === 'add')
				.map(request => request.payload)
				.filter(isBoxEntity);

			const deletedBoxes = this.schemasStore.boxes
				.filter(
					currentBox => boxes.findIndex(newBox => newBox.name === currentBox.name) === -1,
				)
				.filter(
					deletedBox =>
						unsavedBoxes.findIndex(
							unsavedBox => unsavedBox.name === deletedBox.name,
						) === -1,
				);

			const changedBoxes = boxes
				.filter(
					box =>
						unsavedBoxes.findIndex(unsavedBox => unsavedBox.name === box.name) === -1,
				)
				.filter(
					box =>
						!this.schemasStore.boxes.find(
							changedBox =>
								changedBox.name === box.name &&
								changedBox.sourceHash === box.sourceHash,
						),
				);

			addedBoxes.forEach(box => this.schemasStore.addBox(box));
			deletedBoxes.forEach(box => this.schemasStore.deleteBox(box.name, false));
			changedBoxes.forEach(box =>
				this.schemasStore.configurateBox(box, {
					createSnapshot: false,
				}),
			);

			const linkBoxes = result.resources.filter(isLinksDefinition);
			if (linkBoxes) {
				linkBoxes.forEach(linkBox => {
					const linkBoxIndex = this.connectionsStore.linkBoxes?.findIndex(
						lb => lb.name === linkBox.name,
					);
					if (
						linkBoxIndex &&
						this.connectionsStore.linkBoxes &&
						linkBox.sourceHash !==
							this.connectionsStore.linkBoxes[linkBoxIndex].sourceHash
					) {
						this.connectionsStore.linkBoxes[linkBoxIndex] = linkBox;
					}
				});
			}

			const dictionaryList = result.resources.filter(isDictionaryEntity);
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

			const dictionaryLinksEntity = result.resources.filter(isDictionaryLinksEntity)[0];
			if (
				dictionaryLinksEntity &&
				dictionaryLinksEntity.sourceHash !==
					this.schemasStore.dictionaryLinksEntity?.sourceHash
			) {
				this.schemasStore.setDictionaryLinks(dictionaryLinksEntity);
			}
		} catch (error) {
			console.error(error);
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
