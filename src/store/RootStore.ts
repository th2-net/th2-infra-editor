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
	action, computed, observable, reaction, set,
} from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import {
	BoxEntity,
	BoxConnections,
	ConnectionArrow,
	BoxEntityWrapper,
	DictionaryRelation,
} from '../models/Box';
import { intersection } from '../helpers/array';
import LinksDefinition, { isLinksDefinition } from '../models/LinksDefinition';
import Api from '../api/api';
import { isValidBox } from '../helpers/box';
import FileBase from '../models/FileBase';

export default class RootStore {
	constructor(private api: Api) {
		reaction(
			() => this.boxes.map(box => box.kind),
			groups => this.groups = [...new Set(groups)],
		);

		reaction(
			() => this.selectedSchema,
			selectedSchema => {
				this.connectionCoords.clear();
				if (selectedSchema) {
					this.fetchSchemaState(selectedSchema);
				}
			},
		);

		reaction(
			() => this.selectedBox,
			() => this.connectableBoxes = this.connectionChain,
		);
	}

	@observable
	public schemas: string[] = [];

	@observable
	public selectedSchema: string | null = null;

	@observable
	public boxes: Array<BoxEntity> = [];

	@observable
	public selectedBox: BoxEntity | null = null;

	@observable
	public groups: Array<string> = [];

	@observable
	public links: Array<[string, string]> = [];

	@observable
	private linkBox: LinksDefinition | null = null;

	@observable
	public changedBoxes: FileBase[] = [];

	@observable
	public connectionCoords: Map<string, BoxConnections> = new Map();

	@observable
	public connectableBoxes: BoxEntityWrapper[] = [];

	@computed
	public get connectionChain(): BoxEntityWrapper[] {
		if (!this.selectedBox) return [];
		const selectedBoxConnections = this.selectedBox.spec.pins.map(pin => pin['connection-type']);
		const nextBoxes: Array<BoxEntity> = [];
		const previousBoxes: Array<BoxEntity> = [];

		const groupIndex = this.groups.indexOf(this.selectedBox.kind);

		for (let i = groupIndex + 1; i < this.groups.length; i++) {
			const nextGroup = this.groups[i];
			const nextGroupBoxes = this.boxes
				.filter(box => box.kind === nextGroup)
				.filter(box => intersection(
					box.spec.pins.map(pin => pin['connection-type']),
					selectedBoxConnections,
				).length !== 0);
			if (!nextGroupBoxes.length) break;
			nextBoxes.push(...nextGroupBoxes);
		}
		for (let i = groupIndex - 1; i >= 0; i--) {
			const prevGroup = this.groups[i];
			const prevGroupBoxes = this.boxes
				.filter(box => box.kind === prevGroup)
				.filter(box => intersection(
					box.spec.pins.map(pin => pin['connection-type']),
					selectedBoxConnections,
				).length !== 0);
			if (!prevGroupBoxes.length) break;
			previousBoxes.unshift(...prevGroupBoxes);
		}

		return [
			...previousBoxes.map(box => ({
				connection: 'right',
				box,
			} as BoxEntityWrapper)),
			...nextBoxes.map(box => ({
				connection: 'left',
				box,
			} as BoxEntityWrapper)),
		].filter(wrapper => {
			if (this.selectedBox?.name) {
				return !this.links.some(link => (link[0] === this.selectedBox?.name && link[1] === wrapper.box.name)
					|| (link[1] === this.selectedBox?.name && link[0] === wrapper.box.name));
			}
			return false;
		});
	}

	@action
	public addBox = (box: BoxEntity) => {
		this.boxes.push(box);
	};

	@action
	public createNewBox = (newBox: BoxEntity) => {
		if (!this.selectedSchema) return;

		if (this.boxes.find(box => box.kind === newBox.kind && box.name === newBox.name)) {
			// eslint-disable-next-line no-alert
			alert(`Box "${newBox.name}" already exists`);
			return;
		}

		this.api.sendSchemaRequest(this.selectedSchema, [{
			operation: 'add',
			payload: newBox,
		}]).then(res => {
			if (res) {
				this.addBox(newBox);
			}
		});
	};

	@action setSelectedBox = (box: BoxEntity | null) => {
		this.selectedBox = box;
	};

	@action
	public setLinks = (links: LinksDefinition[]) => {
		this.links = links.flatMap(link => {
			if (link.spec['links-definition']) {
				return [
					...link.spec['links-definition']['router-mq']
						.map<[string, string]>(mqLink => [mqLink.from.box, mqLink.to.box]),
					...link.spec['links-definition']['router-grpc']
						.map<[string, string]>(grpcLink => [grpcLink.from.box, grpcLink.to.box]),
				];
			}
			if (link.spec['boxes-relation']) {
				return [
					...link.spec['boxes-relation']['router-mq']
						.map<[string, string]>(mqLink => [mqLink.from.box, mqLink.to.box]),
					...link.spec['boxes-relation']['router-grpc']
						.map<[string, string]>(grpcLink => [grpcLink.from.box, grpcLink.to.box]),
				];
			}
			return [];
		});
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
		this.boxes = result.resources.filter(resItem => isValidBox(resItem));
		const links = result.resources.filter(resItem => isLinksDefinition(resItem)) as LinksDefinition[];
		this.linkBox = links[0];
		this.setLinks(links);
	}

	@action
	public setSelectedSchema(schema: string) {
		this.selectedSchema = schema;
	}

	@action
	public setBoxParamValue = async (boxName: string, paramName: string, value: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);

		if (changedBox) {
			const paramIndex = changedBox.spec.params?.findIndex(param => param.name === paramName);

			if (paramIndex && changedBox.spec.params) {
				changedBox.spec.params[paramIndex].value = value;
			}
			this.saveBoxChanges(changedBox);
		}
	};

	@action
	public saveChanges = async () => {
		if (!this.selectedSchema) return;
		try {
			await this.api.sendSchemaRequest(
				this.selectedSchema,
				this.changedBoxes.map(box => ({
					operation: 'update',
					payload: box,
				})),
			);
			// eslint-disable-next-line no-alert
			alert('Changes saved');
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert('Could\'nt save changes');
		}
	};

	@action
	public createNewSchema = async (schemaName: string) => {
		await this.api.createNewSchema(schemaName);
		this.schemas.push(schemaName);
		this.selectedSchema = schemaName;
	};

	@action
	public addDictionaryRelation = (dictionaryRelation: DictionaryRelation) => {
		const targetBox = this.boxes.find(box => box.name === dictionaryRelation.box);
		if (!targetBox) return;
		if (!targetBox.spec) set(targetBox, 'spec', {});
		if (!targetBox.spec['dictionaries-relation']) {
			set(targetBox.spec, 'dictionaries-relation', [dictionaryRelation]);
			return;
		}
		targetBox.spec['dictionaries-relation'].push(dictionaryRelation);
	};

	@action
	public addCoords = (box: BoxEntity, connections: BoxConnections) => {
		this.connectionCoords.set(box.name, connections);
	};

	@computed
	public get connections(): ConnectionArrow[] {
		const links = this.links.filter(
			link => this.boxes.find(
				box => box.name === link[0],
			)
			&& this.boxes.find(
				box => box.name === link[1],
			),
		);
		if (links.length > 0) {
			return links.map(link => {
				const startBox = this.boxes.find(box => box.name === link[0]);
				const endBox = this.boxes.find(box => box.name === link[1]);
				if (startBox && endBox) {
					const startBoxCoords = this.connectionCoords.get(startBox.name);
					const endBoxCoords = this.connectionCoords.get(endBox.name);
					if (startBoxCoords && endBoxCoords) {
						const startBoxGroupIndex = this.groups.findIndex(group => startBox?.kind === group);
						const endBoxGroupIndex = this.groups.findIndex(group => endBox?.kind === group);

						return {
							start: startBoxGroupIndex < endBoxGroupIndex
								? startBoxCoords.rightConnection
								: startBoxCoords.leftConnection,
							end: startBoxGroupIndex < endBoxGroupIndex
								? endBoxCoords.leftConnection
								: endBoxCoords.rightConnection,
						};
					}
				}
				return {} as ConnectionArrow;
			}).filter(arrow => arrow.start && arrow.end);
		}
		return [];
	}

	@action
	public setConnection = async (box: BoxEntity) => {
		if (!this.selectedSchema || !this.selectedBox || !this.linkBox) return;

		this.links.push([this.selectedBox?.name, box.name]);
		if (this.linkBox?.spec['links-definition']) {
			this.linkBox?.spec['links-definition']['router-grpc'].push({
				name: uuidv4(),
				from: {
					box: this.selectedBox.name,
				},
				to: {
					box: box.name,
				},
			});
		}
		if (this.linkBox?.spec['boxes-relation']) {
			this.linkBox?.spec['boxes-relation']['router-grpc'].push({
				name: uuidv4(),
				from: {
					box: this.selectedBox.name,
					pin: '',
					strategy: '',
				},
				to: {
					box: box.name,
					pin: '',
					strategy: '',
				},
			});
		}
		await this.api.sendSchemaRequest(this.selectedSchema, [{
			operation: 'update',
			payload: this.linkBox,
		}]);
		this.selectedBox = null;
	};

	@action
	public changeCustomConfig = async (config: {[prop: string]: string}, boxName: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);
		if (changedBox) {
			changedBox.spec['custom-config'] = config;
		}
	};

	@action
	public deleteParam = (paramName: string, boxName: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);
		if (changedBox && changedBox.spec.params) {
			const paramIndex = changedBox?.spec.params.findIndex(param => param.name === paramName);

			if (paramIndex >= 0) {
				const params = [...changedBox?.spec.params.filter(param => param.name !== paramName)];
				const boxIndex = this.boxes.findIndex(box => box.name === boxName);
				this.boxes[boxIndex] = {
					...changedBox,
					spec: {
						pins: changedBox.spec.pins,
						'image-name': changedBox.spec['image-name'],
						'image-version': changedBox.spec['image-version'],
						'node-port': changedBox.spec['node-port'],
						params,
					},
				};

				this.saveBoxChanges(changedBox);
			}
		}
	};

	@action
	public setImageInfo = (imageProp: {
		name: 'image-name' | 'image-version' | 'node-port';
		value: string;
	}, boxName: string) => {
		const boxIndex = this.boxes.findIndex(box => box.name === boxName);

		if (boxIndex >= 0) {
			this.boxes[boxIndex].spec[imageProp.name] = (imageProp.name === 'node-port'
				? parseInt(imageProp.value) : imageProp.value) as never;

			this.saveBoxChanges(this.boxes[boxIndex]);
		}
	};

	@action
	public deleteBox = async (boxName: string) => {
		if (!this.selectedSchema) return;
		const removableBoxIndex = this.boxes.findIndex(box => box.name === boxName);
		const isAccess = await this.api.sendSchemaRequest(this.selectedSchema, [{
			operation: 'remove',
			payload: this.boxes[removableBoxIndex],
		}]);
		if (isAccess) {
			this.boxes.splice(removableBoxIndex, 1);
		}
	};

	async init() {
		await this.fetchSchemas();
		if (this.schemas.length) {
			this.setSelectedSchema(this.schemas[0]);
			await this.fetchSchemaState(this.schemas[0]);
		}
	}

	@action
	private saveBoxChanges = (updatedBox: BoxEntity) => {
		if (!this.changedBoxes.includes(updatedBox)) {
			this.changedBoxes.push(updatedBox);
		}
	};
}
