import { diff } from 'deep-object-diff';
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

import {
	action,
	IObservableArray,
	observable,
	reaction,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { rightJoin } from '../helpers/array';
import { isValidBox } from '../helpers/box';
import {
	BoxEntity,
	Pin,
} from '../models/Box';
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
import ConnectionsStore from './ConnectionsStore';
import HistoryStore from './HistoryStore';
import RootStore from './RootStore';

export default class SchemasStore {
	public connectionStore: ConnectionsStore;

	public readonly groups = [
		{
			title: 'Th2Connector',
			types: ['th2-connector'],
			color: '#FF9966',
		},
		{
			title: 'Th2Codec',
			types: ['th2-codec'],
			color: '#66CC91',
		},
		{
			title: 'Th2Act',
			types: ['th2-act', 'th2-verifier', 'th2-book-checker', 'th2-recon'],
			color: '#666DCC',
		},
		{
			title: 'Report',
			types: ['th2-report-data-provider', 'th2-report-data-viewer'],
			color: '#C066CC',
		},
	];

	public readonly connectionTypes = [
		'grpc', 'mq',
	];

	constructor(private rootStore: RootStore, private api: ApiSchema, private historyStore: HistoryStore) {
		this.connectionStore = new ConnectionsStore(rootStore, api, this, historyStore);

		reaction(
			() => this.boxes.map(box => box.spec.type),
			types => this.types = [...new Set(types)],
		);

		reaction(
			() => this.selectedSchema,
			selectedSchema => {
				this.historyStore.clearHistory();
				this.preparedRequests = [];
				this.connectionStore.connections = [];
				this.activeBox = null;
				this.activePin = null;
				this.isLoading = true;
				if (selectedSchema) {
					this.fetchSchemaState(selectedSchema);
				}
			},
		);
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
	public boxes: IObservableArray<BoxEntity> = observable.array([]);

	@observable
	public activeBox: BoxEntity | null = null;

	@observable
	public activePin: Pin | null = null;

	@observable
	public types: Array<string> = [];

	@observable
	public preparedRequests: RequestModel[] = [];

	@observable
	public dictionaryList: DictionaryEntity[] = [];

	@observable
	public dictionaryLinksEntity: DictionaryLinksEntity | null = null;

	@observable
	public expandedBox: BoxEntity | null = null;

	@action
	public addBox = (box: BoxEntity) => {
		this.boxes.push(box);
	};

	@action
	public createBox = (newBox: BoxEntity, createSnapshot = true) => {
		if (!this.selectedSchema) return;

		if (this.boxes.find(box => box.name === newBox.name)) {
			// eslint-disable-next-line no-alert
			alert(`Box "${newBox.name}" already exists`);
			return;
		}
		this.addBox(newBox);
		this.saveBoxChanges(newBox, 'add');
		if (createSnapshot) {
			this.historyStore.addSnapshot({
				object: newBox.name,
				type: 'box',
				operation: 'add',
				changeList: [
					{
						object: newBox.name,
						from: null,
						to: newBox,
					},
				],
			});
		}
	};

	@action setActiveBox = (box: BoxEntity | null) => {
		this.activeBox = box;
	};

	@action setActivePin = (pin: Pin | null) => {
		this.activePin = pin;
	};

	@action setExpandedBox = (box: BoxEntity | null) => {
		this.expandedBox = box;
	};

	@action
	public createDictionary = (dictionary: DictionaryEntity, createSnapshot = true) => {
		this.dictionaryList.push(dictionary);
		this.saveBoxChanges(dictionary, 'add');
		if (createSnapshot) {
			this.historyStore.addSnapshot({
				object: dictionary.name,
				type: 'dictionary',
				operation: 'add',
				changeList: [
					{
						object: dictionary.name,
						from: null,
						to: JSON.parse(JSON.stringify(dictionary)),
					},
				],
			});
		}
	};

	@action
	public deleteDictionary = (dictionaryName: string, createSnapshot = true) => {
		const oldValue = JSON.parse(JSON.stringify(
			this.dictionaryList.find(dictionary => dictionary.name === dictionaryName),
		));
		this.dictionaryList = this.dictionaryList.filter(dictionary => dictionary.name !== dictionaryName);

		if (createSnapshot) {
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
		this.schemas = await this.api.fetchSchemasList();
	}

	schemaAbortController: AbortController | null = null;

	@action
	public async fetchSchemaState(schemaName: string) {
		if (this.schemaAbortController) {
			this.schemaAbortController.abort();
		}
		this.schemaAbortController = new AbortController();
		const result = await this.api.fetchSchemaState(schemaName, this.schemaAbortController.signal);

		this.boxes = observable.array(result.resources.filter(resItem => isValidBox(resItem)));

		const links = result.resources.filter(resItem => isLinksDefinition(resItem)) as LinksDefinition[];
		this.connectionStore.linkBox = links[0];
		this.connectionStore.setLinks(links);

		this.dictionaryList = (result.resources
			.filter(resItem => isDictionaryEntity(resItem)) as DictionaryEntity[]);

		const dictionaryLinksEntity = result.resources.filter(resItem => isDictionaryLinksEntity(resItem));
		this.setDictionaryLinks(dictionaryLinksEntity[0] as DictionaryLinksEntity);

		this.isLoading = false;
	}

	@action
	public setSelectedSchema(schema: string) {
		this.selectedSchema = schema;
	}

	@action
	public saveChanges = async () => {
		if (!this.selectedSchema || this.preparedRequests.length === 0) return;
		try {
			this.isSaving = true;
			await this.api.sendSchemaRequest(
				this.selectedSchema,
				this.preparedRequests,
			);
			this.preparedRequests = [];
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert('Could\'nt save changes');
		} finally {
			this.isSaving = false;
		}
	};

	@action
	public createSchema = async (schemaName: string) => {
		await this.api.createSchema(schemaName);
		this.schemas.push(schemaName);
		this.selectedSchema = schemaName;
	};

	@action
	setDictionaryLinks = (dictionaryLinksEntity: DictionaryLinksEntity) => {
		this.dictionaryLinksEntity = dictionaryLinksEntity;
	};

	@action
	public deleteBox = async (boxName: string, createSnapshot = true) => {
		if (!this.selectedSchema) return;

		const removableBox = this.boxes.find(box => box.name === boxName);

		if (!removableBox) return;

		const changes = new Array<Change>();

		removableBox.spec.pins
			.forEach(pin => changes
				.push(...this.connectionStore.removeConnectionsFromLinkBox(pin, boxName, createSnapshot)));

		this.boxes = observable.array(this.boxes.filter(box => box.name !== boxName));

		this.saveBoxChanges(removableBox, 'remove');
		if (createSnapshot) {
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
	public saveBoxChanges = (
		updatedBox: BoxEntity | LinksDefinition | DictionaryLinksEntity | DictionaryEntity,
		operation: 'add' | 'update' | 'remove',
	) => {
		if (!this.preparedRequests.some(request => request.payload === updatedBox && request.operation === operation)) {
			this.preparedRequests.push({
				operation,
				payload: updatedBox,
			});
		}
	};

	@action
	public configurateBox = (updatedBox: BoxEntity, dictionaryRelations: DictionaryRelation[]) => {
		const oldValue = JSON.parse(JSON.stringify(this.boxes.find(box => box.name === updatedBox.name)));
		const newValue = JSON.parse(JSON.stringify(updatedBox));
		this.boxes = observable.array([...this.boxes.filter(box => box.name !== updatedBox.name), updatedBox]);
		const changeList = this.configurateBoxDictionaryRelations(dictionaryRelations);

		if (Object.entries(diff(oldValue, newValue)).length !== 0) {
			this.saveBoxChanges(updatedBox, 'update');
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
	};

	@action
	public configurateBoxDictionaryRelations = (dictionaryRelations: DictionaryRelation[]): Change[] => {
		if (!this.dictionaryLinksEntity) return [];

		let operation: 'add' | 'remove' = 'add';

		let relations = rightJoin(this.dictionaryLinksEntity.spec['dictionaries-relation'], dictionaryRelations);
		if (!relations.length) {
			relations = rightJoin(dictionaryRelations, this.dictionaryLinksEntity.spec['dictionaries-relation']);
			operation = 'remove';
		}

		const oldValue = JSON.parse(JSON.stringify(this.dictionaryLinksEntity));
		if (operation === 'add') {
			this.dictionaryLinksEntity.spec['dictionaries-relation'].push(...relations);
		} else {
			this.dictionaryLinksEntity.spec['dictionaries-relation'] = this.dictionaryLinksEntity
				.spec['dictionaries-relation']
				.filter(dictionaryRelation => !relations.find(relation =>
					relation.box === dictionaryRelation.box
					&& relation.name === dictionaryRelation.name
					&& relation.dictionary.name === dictionaryRelation.dictionary.name
					&& relation.dictionary.type === dictionaryRelation.dictionary.type));
		}
		const newValue = JSON.parse(JSON.stringify(this.dictionaryLinksEntity));

		if (Object.entries(diff(oldValue, newValue)).length !== 0) {
			this.saveBoxChanges(this.dictionaryLinksEntity, 'update');
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
		const targetBox = this.boxes.find(box => box.name === boxName);
		if (targetBox) {
			const oldValue = (JSON.parse(JSON.stringify(targetBox)) as BoxEntity);
			const pinIndex = targetBox.spec.pins.findIndex(boxPin => boxPin.name === pin.name);

			if (pinIndex >= 0) {
				targetBox.spec.pins = [
					...targetBox.spec.pins.slice(0, pinIndex),
					pin,
					...targetBox.spec.pins.slice(pinIndex + 1, targetBox.spec.pins.length),
				];
				this.saveBoxChanges(targetBox, 'update');
				const newValue = (JSON.parse(JSON.stringify(targetBox)) as BoxEntity);
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
	public configurateDictionary = (dictionaryEntity: DictionaryEntity) => {
		const oldValue = JSON.parse(JSON.stringify(
			this.dictionaryList.find(dictionary => dictionary.name === dictionaryEntity.name),
		));
		this.dictionaryList = [
			...this.dictionaryList.filter(dictionary => dictionary.name !== dictionaryEntity.name),
			dictionaryEntity,
		];
		const newValue = JSON.parse(JSON.stringify(dictionaryEntity));
		this.saveBoxChanges(dictionaryEntity, 'update');
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
	};

	@action
	public deletePinConnections = async (pin: Pin, boxName: string) => {
		if (this.selectedSchema && this.connectionStore.linkBox) {
			const changes = this.connectionStore.removeConnectionsFromLinkBox(pin, boxName);
			this.historyStore.addSnapshot({
				object: pin.name,
				type: 'box',
				operation: 'remove',
				changeList: changes,
			});

			this.saveBoxChanges(this.connectionStore.linkBox, 'update');
		}
	};

	public getBoxBorderColor = (boxName: string) => {
		const boxType = this.boxes.find(box => box.name === boxName)?.spec.type;

		if (boxType) {
			const findedGroup = this.groups.find(group => group.types.includes(boxType));

			if (findedGroup) {
				return findedGroup.color;
			}
			return '#C066CC';
		}
		return 'red';
	};
}
