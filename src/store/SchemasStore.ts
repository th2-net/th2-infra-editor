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

import { action, observable, reaction, computed } from 'mobx';
import { diff } from 'deep-object-diff';
import { v1 } from 'uuid';
import ApiSchema from '../api/ApiSchema';
import { rightJoin, sortByKey, unique } from '../helpers/array';
import { copyObject, getObjectKeys, isEqual } from '../helpers/object';
import { BoxEntity, isBoxEntity, Pin } from '../models/Box';
import {
	DictionaryEntity,
	DictionaryLinksEntity,
	DictionaryRelation,
	isDictionaryEntity,
	isDictionaryLinksEntity,
} from '../models/Dictionary';
import { RequestModel } from '../models/FileBase';
import { Change } from '../models/History';
import LinksDefinition, { isLinksDefinition } from '../models/LinksDefinition';
import { isSettingsEntity, SchemaSettings } from '../models/Schema';
import ConnectionsStore from './ConnectionsStore';
import HistoryStore from './HistoryStore';
import RootStore from './RootStore';
import SubscriptionStore from './SubscriptionStore';

export default class SchemasStore {
	private readonly groupsConfig = [
		{
			title: 'conn',
			types: ['th2-conn', 'th2-read', 'th2-hand'],
			color: '#FF9966',
		},
		{
			title: 'codec',
			types: ['th2-codec'],
			color: '#66CC91',
		},
		{
			title: 'act',
			types: ['th2-act'],
			color: '#666DCC',
		},
		{
			title: 'check',
			types: ['th2-check1', 'th2-check2-recon'],
			color: '#C066CC',
		},
		{
			title: 'script',
			types: ['th2-script'],
			color: '#669966',
		},
		{
			title: 'Th2Resources',
			types: ['th2-rpt-viewer', 'th2-rpt-provider'],
			color: '#CACC66',
		},
	];

	public readonly connectionTypes = ['grpc', 'grpc-client', 'grpc-server', 'mq'];

	public connectionsStore: ConnectionsStore;

	public subscriptionStore: SubscriptionStore | null = null;

	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		private historyStore: HistoryStore,
	) {
		this.connectionsStore = new ConnectionsStore(rootStore, api, this, historyStore);

		this.subscriptionStore = new SubscriptionStore(
			this.rootStore,
			this.api,
			this,
			this.connectionsStore,
		);

		reaction(() => this.selectedSchema, this.onSchemaChange);
	}

	@observable
	public isLoading = false;

	@observable
	public isSaving = false;

	@observable
	public schemas: string[] = [];

	@observable
	public selectedSchema: string | null = null;

	@observable
	public boxes: BoxEntity[] = [];

	@observable
	public activeBox: BoxEntity | null = null;

	@observable
	public activePin: Pin | null = null;

	@observable
	public preparedRequests: RequestModel[] = [];

	@observable
	public dictionaryList: DictionaryEntity[] = [];

	@observable
	public dictionaryLinksEntity: DictionaryLinksEntity | null = null;

	@observable
	public expandedBox: BoxEntity | null = null;

	@observable
	public schemaSettings: SchemaSettings | null = null;

	@observable
	public outlinerSelectedBox: BoxEntity | null = null;

	@observable
	public filterTargetBox: BoxEntity | null = null;

	@computed
	public get groups() {
		return this.groupsConfig.map(group => {
			let boxes: BoxEntity[];
			if (group.title === 'Th2Resources') {
				boxes = this.boxes.filter(box =>
					this.groupsConfig.every(g => !g.types.includes(box.spec.type)),
				);
			} else {
				boxes = this.boxes.filter(box => group.types.some(type => type === box.spec.type));
			}

			return {
				...group,
				boxes: sortByKey(boxes, 'name'),
			};
		});
	}

	@computed
	public get types(): Array<string> {
		return [...new Set(this.boxes.map(box => box.spec.type))];
	}

	@action
	public addBox = (box: BoxEntity) => {
		this.boxes.push(box);
	};

	@action
	public createBox = (box: BoxEntity, createSnapshot = true) => {
		if (!this.selectedSchema || this.checkBoxExisting(box)) return;

		this.addBox(box);

		if (createSnapshot) {
			this.saveEntityChanges(box, 'add');
			this.historyStore.addSnapshot({
				object: box.name,
				type: 'box',
				operation: 'add',
				changeList: [
					{
						object: box.name,
						from: null,
						to: box,
					},
				],
			});
		}
	};

	@action
	public setActiveBox = (box: BoxEntity | null) => {
		this.activeBox = box;
	};

	@action
	public setActivePin = (pin: Pin | null) => {
		this.activePin = pin;
	};

	@action
	public setExpandedBox = (box: BoxEntity | null) => {
		this.expandedBox = box;
	};

	@action
	public setOutlinerSelectedBox = (box: BoxEntity | null) => {
		this.outlinerSelectedBox = box;
	};

	@action
	public setFilterTargetBox = (box: BoxEntity | null) => {
		this.filterTargetBox = box;
	};

	@action
	public createDictionary = (dictionary: DictionaryEntity, createSnapshot = true) => {
		this.dictionaryList.push(dictionary);

		if (createSnapshot) {
			this.saveEntityChanges(dictionary, 'add');
			this.historyStore.addSnapshot({
				object: dictionary.name,
				type: 'dictionary',
				operation: 'add',
				changeList: [
					{
						object: dictionary.name,
						from: null,
						to: copyObject(dictionary),
					},
				],
			});
		}
	};

	@action
	public deleteDictionary = (dictionaryName: string, createSnapshot = true) => {
		const oldValue = copyObject(this.dictionaryList.find(d => d.name === dictionaryName));
		this.dictionaryList = this.dictionaryList.filter(d => d.name !== dictionaryName);

		if (createSnapshot && oldValue) {
			this.saveEntityChanges(oldValue, 'remove');
			this.historyStore.addSnapshot({
				object: dictionaryName,
				type: 'dictionary',
				operation: 'remove',
				changeList: [
					{
						object: dictionaryName,
						from: oldValue,
						to: null,
					},
				],
			});
		}
	};

	@action
	public async fetchSchemas() {
		try {
			this.schemas = await this.api.fetchSchemasList();
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error occured while loading schemas');
				console.error(error);
			}
		}
	}

	schemaAbortController: AbortController | null = null;

	@action
	public async fetchSchemaState(schemaName: string) {
		this.isLoading = true;
		this.schemaAbortController?.abort();
		this.schemaAbortController = new AbortController();

		try {
			const result = await this.api.fetchSchemaState(
				schemaName,
				this.schemaAbortController.signal,
			);

			this.boxes = result.resources.filter(isBoxEntity);

			this.connectionsStore.linkBoxes = result.resources.filter(isLinksDefinition);

			this.dictionaryList = result.resources.filter(isDictionaryEntity);
			const dictionaryLinksEntity = result.resources.filter(isDictionaryLinksEntity);
			if (dictionaryLinksEntity.length > 0) {
				this.setDictionaryLinks(dictionaryLinksEntity[0]);
			}

			const schemaSettings = result.resources.filter(isSettingsEntity);
			if (schemaSettings.length > 0) {
				this.schemaSettings = schemaSettings[0];
			}
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error(`Error occured while fetching schema ${schemaName}`);
				console.error(error);
			}
		} finally {
			this.isLoading = false;
		}
	}

	@action
	public setSelectedSchema = (schema: string) => {
		this.selectedSchema = schema;
	};

	private clearNonExistingLinks = () => {
		this.connectionsStore.links
			.filter(
				link =>
					!(
						(link.from && this.checkBoxExistingByName(link.from?.box)) ||
						this.dictionaryList.find(dictionary => dictionary.name === link.from?.box)
					) ||
					!(
						(link.to && this.checkBoxExistingByName(link.to?.box)) ||
						this.dictionaryList.find(dictionary => dictionary.name === link.to?.box)
					),
			)
			.forEach(link => this.connectionsStore.deleteLink(link));
		if (this.dictionaryLinksEntity)
			this.saveEntityChanges(
				{
					...this.dictionaryLinksEntity,
					spec: {
						'dictionaries-relation': this.dictionaryLinksEntity.spec[
							'dictionaries-relation'
						].filter(
							link =>
								this.checkBoxExistingByName(link.box) ||
								this.dictionaryList.find(
									dictionary => dictionary.name === link.box,
								),
						),
					},
				},
				'update',
			);
	};

	@action
	public saveChanges = async () => {
		this.clearNonExistingLinks();
		if (!this.selectedSchema || this.preparedRequests.length === 0) return;
		try {
			this.isSaving = true;
			const response = await this.api.sendSchemaRequest(
				this.selectedSchema,
				this.preparedRequests,
			);
			const validationErrors = response.validationErrors;
			if (!response.commitRef && validationErrors) {
				getObjectKeys(validationErrors.linkErrorMessages).forEach(links =>
					validationErrors.linkErrorMessages[links].forEach(linkError => {
						this.rootStore.notificationsStore.addMessage({
							type: 'error',
							errorType: 'responseError',
							id: v1(),
							resource: linkError.linkName,
							header: linkError.linkName,
							responseBody: linkError.message,
							responseCode: null,
						});
					}),
				);
				validationErrors.boxResourceErrorMessages.forEach(boxResourceError => {
					this.rootStore.notificationsStore.addMessage({
						type: 'error',
						errorType: 'responseError',
						id: v1(),
						resource: boxResourceError.box,
						header: boxResourceError.box,
						responseBody: boxResourceError.message,
						responseCode: null,
					});
				});
				validationErrors.exceptionMessages.forEach(exceptionMessage => {
					this.rootStore.notificationsStore.addMessage({
						type: 'error',
						errorType: 'responseError',
						id: v1(),
						resource: 'Exception message',
						header: 'Exception message',
						responseBody: exceptionMessage,
						responseCode: null,
					});
				});
			}
			this.preparedRequests = [];
		} catch (error) {
			alert("Couldn't save changes");
		} finally {
			this.isSaving = false;
		}
	};

	@action
	public createSchema = async (schemaName: string) => {
		try {
			await this.api.createSchema(schemaName);
			this.schemas.push(schemaName);
			this.selectedSchema = schemaName;
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error(`Error occured while creating schema ${schemaName}`);
				console.error(error);
			}
		}
	};

	public checkSchemaExistingByName = (schemaName: string) => {
		return this.schemas.find(_schemaName => _schemaName === schemaName) !== undefined;
	};

	@action
	setDictionaryLinks = (dictionaryLinksEntity: DictionaryLinksEntity) => {
		this.dictionaryLinksEntity = dictionaryLinksEntity;
	};

	@action
	public deleteBox = async (
		boxName: string,
		deleteRelatedLinks: boolean,
		createSnapshot = true,
	) => {
		if (!this.selectedSchema) return;

		const removableBox = this.boxes.find(box => box.name === boxName);

		if (!removableBox) return;

		const changes: Array<Change> = [];

		if (removableBox.spec.pins && deleteRelatedLinks) {
			removableBox.spec.pins.forEach(pin =>
				changes.push(
					...this.connectionsStore.removeRelatedToPinLinks(pin, boxName, createSnapshot),
				),
			);
		}

		this.boxes = this.boxes.filter(box => box.name !== boxName);

		if (createSnapshot) {
			this.saveEntityChanges(removableBox, 'remove');
			this.historyStore.addSnapshot({
				object: boxName,
				type: 'box',
				operation: 'remove',
				changeList: [
					{
						object: removableBox.name,
						from: removableBox,
						to: null,
					},
					...changes,
				],
			});
		}
	};

	@action
	public saveEntityChanges = (
		entity: BoxEntity | LinksDefinition | DictionaryLinksEntity | DictionaryEntity,
		operation: 'add' | 'update' | 'remove',
	) => {
		if (
			!this.preparedRequests.some(
				request =>
					request.payload.name === entity.name &&
					request.operation === operation &&
					!hasChanges(request.payload, entity),
			)
		) {
			this.preparedRequests.push({
				operation,
				payload: entity,
			});
		}

		function hasChanges<T extends object>(obj1: T, obj2: T) {
			return Object.keys(diff(obj1, obj2)).length > 0;
		}
	};

	@action
	public configurateBox = (
		oldBox: BoxEntity,
		updatedBox: BoxEntity,
		options?: {
			dictionaryRelations?: DictionaryRelation[];
			createSnapshot?: boolean;
		},
	) => {
		if (oldBox.name !== updatedBox.name && this.checkBoxExisting(updatedBox)) return;

		const isChanged = Boolean(Object.values(diff(oldBox, updatedBox)).length);

		let oldValue;
		let newValue;
		if (isChanged) {
			oldValue = copyObject(oldBox);
			newValue = copyObject(updatedBox);
			if (oldBox.name === updatedBox.name) {
				this.boxes = [...this.boxes.filter(box => box.name !== oldBox.name), updatedBox];
			} else {
				this.deleteBox(oldBox.name, false, false);
				this.createBox(updatedBox, false);
			}
		}

		let changeList: Change[] = [];

		if (oldBox.name !== updatedBox.name) {
			this.connectionsStore.replaceDestinationBoxForAllRelatedToBoxLinks(
				oldBox.name,
				updatedBox.name,
			);
			const dictionariesChangeList = this.replaceNameForAllRelatedToBoxDictionaries(
				oldBox.name,
				updatedBox.name,
			);
			changeList.unshift(...dictionariesChangeList);
		}

		if (options?.dictionaryRelations) {
			changeList = this.configurateBoxDictionaryRelations(
				options.dictionaryRelations,
				updatedBox.name,
			);
		}

		if (options?.createSnapshot !== false) {
			if (isChanged && oldValue && newValue) {
				if (oldBox.name === updatedBox.name) {
					this.saveEntityChanges(updatedBox, 'update');
				} else {
					this.saveEntityChanges(oldBox, 'remove');
					this.saveEntityChanges(updatedBox, 'add');
				}
				changeList.unshift({
					object: updatedBox.name,
					from: oldValue,
					to: newValue,
				});
			}
			this.historyStore.addSnapshot({
				object: updatedBox.name,
				type: 'box',
				operation: 'change',
				changeList,
			});
		}
	};

	@action
	private replaceNameForAllRelatedToBoxDictionaries = (
		oldBoxName: string,
		newBoxName: string,
	): Change[] => {
		if (!this.dictionaryLinksEntity) return [];

		const oldValue = JSON.parse(JSON.stringify(this.dictionaryLinksEntity));
		this.dictionaryLinksEntity = {
			...this.dictionaryLinksEntity,
			spec: {
				'dictionaries-relation': this.dictionaryLinksEntity.spec[
					'dictionaries-relation'
				].map(dictionaryLink => {
					const tempDictionary = dictionaryLink;
					if (tempDictionary.box === oldBoxName) {
						tempDictionary.box = newBoxName;
					}
					return tempDictionary;
				}),
			},
		};

		const newValue = JSON.parse(JSON.stringify(this.dictionaryLinksEntity));

		this.saveEntityChanges(this.dictionaryLinksEntity, 'update');
		return [
			{
				object: this.dictionaryLinksEntity.name,
				from: oldValue,
				to: newValue,
			},
		];
	};

	@action
	public configurateBoxDictionaryRelations = (
		dictionaryRelations: DictionaryRelation[],
		boxName: string,
	): Change[] => {
		if (!this.dictionaryLinksEntity) return [];

		const boxRelations = this.dictionaryLinksEntity.spec['dictionaries-relation'].filter(
			link => link.box === boxName,
		);

		let operation: 'add' | 'remove' = 'add';

		let relations = rightJoin(boxRelations, dictionaryRelations);
		if (!relations.length) {
			relations = rightJoin(dictionaryRelations, boxRelations);
			if (!relations.length) return [];

			operation = 'remove';
		}

		const oldValue = JSON.parse(JSON.stringify(this.dictionaryLinksEntity));
		if (operation === 'add') {
			this.dictionaryLinksEntity.spec['dictionaries-relation'].push(...relations);
		} else {
			this.dictionaryLinksEntity.spec['dictionaries-relation'] =
				this.dictionaryLinksEntity.spec['dictionaries-relation'].filter(
					dictionaryRelation =>
						!relations.find(
							relation =>
								relation.box === dictionaryRelation.box &&
								relation.name === dictionaryRelation.name &&
								relation.dictionary.name === dictionaryRelation.dictionary.name &&
								relation.dictionary.type === dictionaryRelation.dictionary.type,
						),
				);
		}
		const newValue = JSON.parse(JSON.stringify(this.dictionaryLinksEntity));

		if (Object.entries(diff(oldValue, newValue)).length !== 0) {
			this.saveEntityChanges(this.dictionaryLinksEntity, 'update');
			return [
				{
					object: this.dictionaryLinksEntity.name,
					from: oldValue,
					to: newValue,
				},
			];
		}
		return [];
	};

	@action
	public configuratePin = (pin: Pin, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName) || null;
		if (targetBox && targetBox.spec.pins) {
			const oldValue = copyObject(targetBox);
			const pinIndex = targetBox.spec.pins.findIndex(boxPin => boxPin.name === pin.name);

			if (pinIndex >= 0) {
				targetBox.spec.pins = [
					...targetBox.spec.pins.slice(0, pinIndex),
					pin,
					...targetBox.spec.pins.slice(pinIndex + 1, targetBox.spec.pins.length),
				];
				this.saveEntityChanges(targetBox, 'update');
				const newValue = copyObject(targetBox);
				this.historyStore.addSnapshot({
					object: boxName,
					type: 'box',
					operation: 'change',
					changeList: [
						{
							object: oldValue.name,
							from: oldValue,
							to: newValue,
						},
					],
				});
			}
		}
	};

	@action
	public configurateDictionary = (
		dictionaryEntity: DictionaryEntity,
		oldDictionary: DictionaryEntity,
		createSnapshot = true,
	) => {
		const oldValue = JSON.parse(JSON.stringify(oldDictionary));
		this.dictionaryList = [
			...this.dictionaryList.filter(dictionary => !isEqual(dictionary, oldDictionary)),
			dictionaryEntity,
		];
		const newValue = JSON.parse(JSON.stringify(dictionaryEntity));

		if (dictionaryEntity.name !== oldDictionary.name && this.dictionaryLinksEntity) {
			const changedRelationsIndices = this.dictionaryLinksEntity.spec['dictionaries-relation']
				.filter(relation => relation.dictionary.name === oldDictionary.name)
				.map(targetRelation =>
					this.dictionaryLinksEntity
						? this.dictionaryLinksEntity.spec['dictionaries-relation'].findIndex(
								relation => relation.name === targetRelation.name,
						  )
						: -1,
				);

			changedRelationsIndices.forEach(index => {
				if (this.dictionaryLinksEntity && index !== -1) {
					this.dictionaryLinksEntity.spec['dictionaries-relation'][
						index
					].dictionary.name = dictionaryEntity.name;
				}
			});

			this.saveEntityChanges(this.dictionaryLinksEntity, 'update');
		}

		if (createSnapshot) {
			this.saveEntityChanges(dictionaryEntity, 'update');
			this.historyStore.addSnapshot({
				object: dictionaryEntity.name,
				type: 'dictionary',
				operation: 'change',
				changeList: [
					{
						object: dictionaryEntity.name,
						from: oldValue,
						to: newValue,
					},
				],
			});
		}
	};

	@action
	public deletePinConnections = async (pin: Pin, boxName: string) => {
		if (this.selectedSchema && this.connectionsStore.linkBoxes) {
			this.connectionsStore.linkBoxes.forEach(linkBox => {
				if (
					['router-grpc', 'router-mq'].some(connectionType => {
						return (
							linkBox.spec['boxes-relation']?.[
								connectionType as 'router-grpc' | 'router-mq'
							] &&
							linkBox.spec['boxes-relation']?.[
								connectionType as 'router-grpc' | 'router-mq'
							].some(
								link =>
									(link.from?.box === boxName && link.from?.pin === pin.name) ||
									(link.to?.box === boxName && link.to?.pin === pin.name),
							)
						);
					})
				) {
					this.saveEntityChanges(linkBox, 'update');
				}
			});
			const changes = this.connectionsStore.removeRelatedToPinLinks(pin, boxName);
			this.historyStore.addSnapshot({
				object: pin.name,
				type: 'box',
				operation: 'remove',
				changeList: changes,
			});
		}
	};

	@computed
	public get connectedToFilterTargetBoxBoxes(): string[] {
		if (!this.filterTargetBox) return [];

		const filterTargetBoxName = this.filterTargetBox.name;
		const connectedBoxes = unique(
			this.connectionsStore.links.reduce((boxes, link) => {
				if (link.from?.box === filterTargetBoxName && link.to) {
					boxes.push(link.to.box);
				}
				if (link.to?.box === filterTargetBoxName && link.from) {
					boxes.push(link.from.box);
				}
				return boxes;
			}, new Array<string>()),
		);
		connectedBoxes.push(this.filterTargetBox.name);

		return connectedBoxes;
	}

	public getBoxBorderColor = (boxName: string) => {
		const boxType = this.boxes.find(box => box.name === boxName)?.spec.type;
		if (!boxType) return 'red';
		const targetGroup = this.groups.find(group => group.types.includes(boxType));
		return targetGroup ? targetGroup.color : '#C066CC';
	};

	public checkBoxExistingByName = (boxName: string) => {
		return this.boxes.find(_box => _box.name === boxName) !== undefined;
	};

	private checkBoxExisting = (box: BoxEntity) => {
		if (this.checkBoxExistingByName(box.name)) {
			alert(`Box "${box.name}" already exists`);
			return true;
		}
		return false;
	};

	@action
	private onSchemaChange = (selectedSchema: string | null) => {
		this.historyStore.clearHistory();
		this.preparedRequests = [];
		this.connectionsStore.connections.clear();
		this.activeBox = null;
		this.activePin = null;

		if (selectedSchema) {
			this.fetchSchemaState(selectedSchema);
		}
	};
}
