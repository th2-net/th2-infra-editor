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
import {
	BoxEntity,
	BoxConnections,
	ConnectionArrow,
	DictionaryRelation,
	Pin,
} from '../models/Box';
import { intersection } from '../helpers/array';
import LinksDefinition, { isLinksDefinition, Link } from '../models/LinksDefinition';
import Api from '../api/api';
import { isValidBox } from '../helpers/box';
import FileBase from '../models/FileBase';
import { convertLinks } from '../helpers/link';

export default class RootStore {
	constructor(private api: Api) {
		reaction(
			() => this.boxes.map(box => box.kind),
			groups => this.groups = [...new Set(groups)],
		);

		reaction(
			() => this.selectedSchema,
			selectedSchema => {
				this.connectionCoords = [];
				this.selectedBox = null;
				this.selectedPin = null;
				if (selectedSchema) {
					this.fetchSchemaState(selectedSchema);
				}
			},
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
	public selectedPin: Pin | null = null;

	@observable
	public groups: Array<string> = [];

	@observable
	public links: Array<Link> = [];

	@observable
	private linkBox: LinksDefinition | null = null;

	@observable
	public changedBoxes: FileBase[] = [];

	@observable
	public connectionCoords: Array<[[string, string], BoxConnections]> = [];

	@computed
	public get connectionChain(): BoxEntity[] {
		if (!this.selectedBox) return [];
		const nextBoxes: Array<BoxEntity> = [];
		const previousBoxes: Array<BoxEntity> = [];

		const groupIndex = this.groups.indexOf(this.selectedBox.kind);

		for (let i = groupIndex + 1; i < this.groups.length; i++) {
			const nextGroup = this.groups[i];
			const nextGroupBoxes = this.boxes
				.filter(box => box.kind === nextGroup)
				.filter(box => intersection(
					box.spec.pins.map(pin => pin['connection-type']),
					this.selectedPin
						? [this.selectedPin?.['connection-type']]
						: this.selectedBox
							? this.selectedBox.spec.pins.map(pin => pin['connection-type'])
							: [],
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
					this.selectedPin
						? [this.selectedPin?.['connection-type']]
						: this.selectedBox
							? this.selectedBox.spec.pins.map(pin => pin['connection-type'])
							: [],
				).length !== 0);
			if (!prevGroupBoxes.length) break;
			previousBoxes.unshift(...prevGroupBoxes);
		}

		const chain = [
			...previousBoxes,
			...nextBoxes,
		];
		if (this.selectedPin) {
			return chain.filter(box => {
				if (this.selectedBox?.name) {
					return !this.links
						.some(link => (link.from.box === this.selectedBox?.name && link.to.box === box.name)
						|| (link.to.box === this.selectedBox?.name && link.from.box === box.name));
				}
				return false;
			});
		}
		return chain;
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

	@action setSelectedPin = (pin: Pin | null) => {
		this.selectedPin = pin;
	};

	@action
	public setLinks = (links: LinksDefinition[]) => {
		this.links = links.flatMap(link => {
			if (link.spec['links-definition']) {
				return [
					...convertLinks(link.spec['links-definition']['router-mq'], 'mq'),
					...convertLinks(link.spec['links-definition']['router-grpc'], 'grpc'),
				];
			}
			if (link.spec['boxes-relation']) {
				return [
					...convertLinks(link.spec['boxes-relation']['router-mq'], 'mq'),
					...convertLinks(link.spec['boxes-relation']['router-grpc'], 'grpc'),
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
	public addCoords = (box: string, pin: string, connections: BoxConnections) => {
		const coordIndex = this.connectionCoords.findIndex(coord => coord[0][0] === box && coord[0][1] === pin);
		if (coordIndex === -1) {
			this.connectionCoords.push([[box, pin], connections]);
		} else {
			this.connectionCoords.splice(coordIndex, 1, [[box, pin], connections]);
		}
	};

	@computed
	public get connections(): ConnectionArrow[] {
		const links = this.links.filter(
			link => this.boxes.find(
				box => box.name === link.from.box,
			)
			&& this.boxes.find(
				box => box.name === link.from.box,
			),
		);
		if (links.length > 0) {
			return links.map(link => {
				const startBox = this.boxes.find(box => box.name === link.from.box);
				const endBox = this.boxes.find(box => box.name === link.to.box);
				if (startBox && endBox) {
					const startBoxCoords = this.connectionCoords.find(coords => coords[0][0] === startBox.name
						&& coords[0][1] === link.from.pin);
					const endBoxCoords = this.connectionCoords.find(coords => coords[0][0] === endBox.name
						&& coords[0][1] === link.to.pin);
					if (startBoxCoords && endBoxCoords) {
						const startBoxGroupIndex = this.groups.findIndex(group => startBox?.kind === group);
						const endBoxGroupIndex = this.groups.findIndex(group => endBox?.kind === group);

						return {
							name: link.name,
							start: startBoxGroupIndex < endBoxGroupIndex
								? startBoxCoords[1].rightConnection
								: startBoxCoords[1].leftConnection,
							end: startBoxGroupIndex < endBoxGroupIndex
								? endBoxCoords[1].leftConnection
								: endBoxCoords[1].rightConnection,
						};
					}
				}
				return {} as ConnectionArrow;
			}).filter(arrow => arrow.start && arrow.end);
		}
		return [];
	}

	@action
	public setConnection = async (connectionName: string, pin: Pin, box: BoxEntity) => {
		if (!this.selectedSchema || !this.selectedBox || !this.selectedPin || !this.linkBox) return;
		this.links.push({
			name: connectionName,
			from: {
				box: this.selectedBox.name,
				pin: this.selectedPin.name,
				connectionType: pin['connection-type'],
			},
			to: {
				box: box.name,
				pin: pin.name,
				connectionType: pin['connection-type'],
			},
		});
		const newConnection = {
			name: connectionName,
			from: {
				box: this.selectedBox.name,
				pin: this.selectedPin.name,
			},
			to: {
				box: box.name,
				pin: pin.name,
			},
		};
		if (this.linkBox.spec['links-definition']) {
			this.linkBox.spec['links-definition'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')]
				.push(newConnection);
		}
		if (this.linkBox.spec['boxes-relation']) {
			this.linkBox.spec['boxes-relation'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')]
				.push(newConnection);
		}
		this.saveBoxChanges(this.linkBox);
		this.selectedBox = null;
		this.selectedPin = null;
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
		const isSuccess = await this.api.sendSchemaRequest(this.selectedSchema, [{
			operation: 'remove',
			payload: this.boxes[removableBoxIndex],
		}]);
		if (isSuccess) {
			this.boxes[removableBoxIndex].spec.pins.forEach(pin => this.removeConnectionsFromLinkBox(pin, boxName));
			this.boxes.splice(removableBoxIndex, 1);
		}
	};

	@action
	private saveBoxChanges = (updatedBox: BoxEntity | LinksDefinition) => {
		if (!this.changedBoxes.includes(updatedBox)) {
			this.changedBoxes.push(updatedBox);
		}
	};

	@action
	public configuratePin = (pin: Pin, boxName: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);

		if (changedBox) {
			changedBox.spec.pins = [...changedBox.spec.pins
				.filter(changeBoxPin => changeBoxPin.name !== pin.name), pin];
			this.saveBoxChanges(changedBox);
		}
	};

	@action
	public addPinToBox = (pin: Pin, boxName: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);

		if (changedBox) {
			changedBox.spec.pins = [...changedBox.spec.pins, pin];
			this.saveBoxChanges(changedBox);
		}
	};

	@action
	public removePinFromBox = (pin: Pin, boxName: string) => {
		const changedBox = this.boxes.find(box => box.name === boxName);

		if (changedBox) {
			changedBox.spec.pins = [...changedBox.spec.pins.filter(boxPin => boxPin.name !== pin.name)];
			this.removeConnectionsFromLinkBox(pin, boxName);
			this.saveBoxChanges(changedBox);
		}
	};

	@action
	private removeConnectionsFromLinkBox = (pin: Pin, boxName: string) => {
		this.links = [...this.links.filter(connection => (connection.from.box !== boxName
			&& connection.from.pin !== pin.name)
			&& (connection.to.box !== boxName
				&& connection.to.pin !== pin.name))];
		if (this.linkBox?.spec['links-definition']) {
			this.linkBox
				// eslint-disable-next-line max-len
				.spec['links-definition'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')] = [...this.linkBox
					.spec['links-definition'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')]
					.filter(connection =>
						connection.from.pin !== pin.name
						&& connection.from.box !== boxName)];
		}
		if (this.linkBox?.spec['boxes-relation']) {
			this.linkBox
				// eslint-disable-next-line max-len
				.spec['boxes-relation'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')] = [...this.linkBox
					.spec['boxes-relation'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')]
					.filter(connection =>
						connection.from.pin !== pin.name
						&& connection.from.box !== boxName)];
		}
	};

	@action
	public deletePinConnections = async (pin: Pin, boxName: string) => {
		if (this.selectedSchema && this.linkBox) {
			this.removeConnectionsFromLinkBox(pin, boxName);

			await this.api.sendSchemaRequest(this.selectedSchema, [{
				operation: 'update',
				payload: this.linkBox,
			}]);
		}
	};

	@action
	public deleteConnection = async (connection: ConnectionArrow) => {
		if (this.selectedSchema && this.linkBox) {
			this.links = [...this.links.filter(link => link.from.box !== connection.start.connectionOwner.box
				&& link.to.box !== connection.end.connectionOwner.box
				&& link.from.pin !== connection.start.connectionOwner.pin
				&& link.to.pin !== connection.end.connectionOwner.pin),
			];
			if (this.linkBox?.spec['links-definition']) {
				const linkIndex = this.linkBox
					.spec['links-definition'][`router-${connection
						.start.connectionOwner.connectionType}` as 'router-mq' | 'router-grpc']
					.findIndex(link => link.name === connection.name);
				this.linkBox
					.spec['links-definition'][`router-${connection
						.start.connectionOwner.connectionType}` as 'router-mq' | 'router-grpc']
					.splice(linkIndex, 1);
			}
			if (this.linkBox?.spec['boxes-relation']) {
				const linkIndex = this.linkBox
					.spec['boxes-relation'][`router-${connection
						.start.connectionOwner.connectionType}` as 'router-mq' | 'router-grpc']
					.findIndex(link => link.name === connection.name);
				this.linkBox
					.spec['boxes-relation'][`router-${connection
						.start.connectionOwner.connectionType}` as 'router-mq' | 'router-grpc']
					.splice(linkIndex, 1);
			}

			this.saveBoxChanges(this.linkBox);
		}
	};

	async init() {
		await this.fetchSchemas();
		if (this.schemas.length) {
			this.setSelectedSchema(this.schemas[0]);
			await this.fetchSchemaState(this.schemas[0]);
		}
	}
}
