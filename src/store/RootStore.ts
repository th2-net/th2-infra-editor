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
	action, computed, observable, reaction,
} from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import {
	BoxEntity,
	BoxConnections,
	ConnectionArrow,
	BoxEntityWrapper,
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
			selectedSchema => this.fetchSchemaState(selectedSchema),
		);

		reaction(
			() => this.selectedBox,
			() => this.connectableBoxes = this.connectionChain,
		);
	}

	@observable
	public schemas: string[] = [];

	@observable
	public selectedBox: BoxEntity | null = null;

	@observable
	public boxes: Array<BoxEntity> = [];

	@observable
	public groups: Array<string> = [];

	@observable
	public links: Array<[string, string]> = [];

	@observable
	public selectedSchema = 'master';

	@observable
	public changedBoxes: FileBase[] = [];

	@observable
	public connectionCoords: Map<BoxEntity, BoxConnections> = new Map();

	@observable
	public connectableBoxes: BoxEntityWrapper[] = [];

	@observable
	private linkBox: LinksDefinition | null = null;

	schemaAbortConroller: AbortController | null = null;

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
	public createNewBox = (box: BoxEntity) => {
		this.api.sendSchemaRequest(this.selectedSchema, [{
			operation: 'add',
			payload: box,
		}]).then(res => {
			if (res) {
				this.addBox(box);
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

	@action
	public async fetchSchemaState(schemaName: string) {
		if (this.schemaAbortConroller) {
			this.schemaAbortConroller.abort();
		}
		this.schemaAbortConroller = new AbortController();
		const result = await this.api.fetchSchemaState(schemaName, this.schemaAbortConroller.signal);
		this.boxes = result.filter(resItem => isValidBox(resItem)) as BoxEntity[];
		const links = result.filter(resItem => isLinksDefinition(resItem)) as LinksDefinition[];
		this.linkBox = links[0];
		this.setLinks(links);
	}

	@action
	public setSelectedSchema(schema: string) {
		this.selectedSchema = schema;
	}

	@action
	public setBoxParamValue = async (boxName: string, paramName: string, value: string) => {
		const boxIndex = this.boxes.findIndex(box => box.name === boxName);
		const paramIndex = this.boxes[boxIndex].spec.params.findIndex(param => param.name === paramName);
		this.boxes[boxIndex].spec.params[paramIndex].value = value;

		if (!this.changedBoxes.includes(this.boxes[boxIndex])) {
			this.changedBoxes.push(this.boxes[boxIndex]);
		}
	};

	@action
	public saveChanges = () => {
		this.api.sendSchemaRequest(
			this.selectedSchema,
			this.changedBoxes.map(box => ({
				operation: 'update',
				payload: box,
			})),
		// eslint-disable-next-line no-alert
		).then(() => alert('Changes saved'));
	};

	@action
	public async createNewSchema(schemaName: string) {
		await this.api.createNewSchema(schemaName)
			.then(() => {
				this.schemas.push(schemaName);
				this.selectedSchema = schemaName;
			});
	}

	@action
	public addNewProp = (prop: {
		name: string;
		value: string;
	}, boxName: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);
		changedBox?.spec.params.push(prop);

		if (changedBox && !this.changedBoxes.includes(changedBox)) {
			this.changedBoxes.push(changedBox);
		}
	};

	@action
	public addCoords = (box: BoxEntity, connections: BoxConnections) => {
		this.connectionCoords.set(box, connections);
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
					const startBoxCoords = this.connectionCoords.get(startBox);
					const endBoxCoords = this.connectionCoords.get(endBox);
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
		if (this.selectedBox && this.linkBox) {
			this.links.push([this.selectedBox?.name, box.name]);
			if (this.linkBox?.spec['links-definition']) {
				this.linkBox?.spec['links-definition']['router-grpc'].push({
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
		}
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
		if (changedBox) {
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

				if (!this.changedBoxes.includes(changedBox)) {
					this.changedBoxes.push(changedBox);
				}
			}
		}
	};

	async init() {
		await this.fetchSchemas();
		await this.fetchSchemaState(this.selectedSchema);
	}
}
