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
	action, computed, IObservableArray, observable, reaction, set,
} from 'mobx';
import {
	BoxEntity,
	BoxConnections,
	ConnectionArrow,
	DictionaryRelation,
	Pin,
	Filter,
	BoxEntityWrapper,
	ConnectionOwner,
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
				this.activeBox = null;
				this.activePin = null;
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
	public boxes: IObservableArray<BoxEntity> = observable.array([]);

	@observable
	public activeBox: BoxEntity | null = null;

	@observable
	public activePin: Pin | null = null;

	@observable
	public selectedLink: string | null = null;

	@observable
	public groups: Array<string> = [];

	@observable
	public links: Array<Link> = [];

	@observable
	private linkBox: LinksDefinition | null = null;

	@observable
	public changedBoxes: Array<FileBase> = [];

	@observable
	public connectionCoords: Array<[ConnectionOwner, BoxConnections]> = [];

	@computed
	public get connectionChain(): BoxEntityWrapper[] {
		if (!this.activeBox || !this.activePin) return [];
		const boxes: Array<BoxEntity> = [];

		const groupIndex = this.groups.indexOf(this.activeBox.kind);

		for (let i = 0; i < this.groups.length; i++) {
			// eslint-disable-next-line no-continue
			if (i === groupIndex) continue;
			const nextGroupBoxes = this.getConnectableBoxes(i);
			if (!nextGroupBoxes.length) break;
			boxes.push(...nextGroupBoxes);
		}

		const activeBoxCoords = this.connectionCoords.find(coord => coord[0].box === this.activeBox?.name);

		if (!activeBoxCoords) return [];

		return boxes.map(box => {
			const findedBoxCoords = this.connectionCoords.find(coord => coord[0].box === box.name);
			return {
				box,
				direction: findedBoxCoords
					? findedBoxCoords[1].leftConnection.left < activeBoxCoords[1].leftConnection.left
						? 'right' as 'right' : 'left' as 'left' : 'left' as 'left',
			};
		});
	}

	private getConnectableBoxes(index: number) {
		const group = this.groups[index];
		return this.boxes
			.filter(box => box.kind === group)
			.filter(box => intersection(
				box.spec.pins.map(pin => pin['connection-type']),
				this.activePin
					? [this.activePin?.['connection-type']]
					: this.activeBox
						? this.activeBox.spec.pins.map(pin => pin['connection-type'])
						: [],
			).length !== 0);
	}

	@action
	public addBox = (box: BoxEntity) => {
		this.boxes.push(box);
	};

	@action
	public createNewBox = (newBox: BoxEntity) => {
		if (!this.selectedSchema) return;

		if (this.boxes.find(box => box.name === newBox.name)) {
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

	@action setActiveBox = (box: BoxEntity | null) => {
		this.activeBox = box;
	};

	@action setActivePin = (pin: Pin | null) => {
		this.activePin = pin;
	};

	@action setSelectedLink = (link: string | null) => {
		this.selectedLink = link;
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
		this.boxes = observable.array(result.resources.filter(resItem => isValidBox(resItem)));
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
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			const paramIndex = targetBox.spec.params?.findIndex(param => param.name === paramName);

			if (paramIndex && targetBox.spec.params) {
				targetBox.spec.params[paramIndex].value = value;
			}
			this.saveBoxChanges(targetBox);
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
	public addCoords = (box: string, pinConnections: { pin: string; connections: BoxConnections }[]) => {
		pinConnections.forEach(pinConnection => {
			const coordIndex = this.connectionCoords
				.findIndex(coord => coord[0].box === box && coord[0].pin === pinConnection.pin);
			if (coordIndex === -1) {
				this.connectionCoords.push(
					[
						{
							box,
							pin: pinConnection.pin,
							connectionType: pinConnection.connections.leftConnection.connectionOwner.connectionType,
						}, pinConnection.connections,
					],
				);
			} else {
				this.connectionCoords.splice(coordIndex, 1,
					[
						{
							box,
							pin: pinConnection.pin,
							connectionType: pinConnection.connections.leftConnection.connectionOwner.connectionType,
						}, pinConnection.connections,
					]);
			}
		});
	};

	@computed
	public get connections(): ConnectionArrow[] {
		if (!this.connectionCoords.length) return [];
		return this.links.map(link => {
			const startBox = this.boxes.find(box => box.name === link.from.box);
			const endBox = this.boxes.find(box => box.name === link.to.box);
			if (startBox && endBox) {
				const startBoxCoords = this.connectionCoords.find(coords => coords[0].box === startBox.name
					&& coords[0].pin === link.from.pin);
				const endBoxCoords = this.connectionCoords.find(coords => coords[0].box === endBox.name
					&& coords[0].pin === link.to.pin);
				if (startBoxCoords && endBoxCoords) {
					return {
						name: link.name,
						start: startBoxCoords[1].rightConnection.left < endBoxCoords[1].leftConnection.left
							? startBoxCoords[1].rightConnection
							: startBoxCoords[1].leftConnection,
						end: startBoxCoords[1].rightConnection.left < endBoxCoords[1].leftConnection.left
							? endBoxCoords[1].leftConnection
							: endBoxCoords[1].rightConnection,
					};
				}
			}
			return {} as ConnectionArrow;
		}).filter(arrow => arrow.start && arrow.end);
	}

	@action
	public setConnection = async (connectionName: string, pin: Pin, box: BoxEntity) => {
		if (!this.selectedSchema || !this.activeBox || !this.activePin || !this.linkBox) return;
		this.links.push({
			name: connectionName,
			from: {
				box: this.activeBox.name,
				pin: this.activePin.name,
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
				box: this.activeBox.name,
				pin: this.activePin.name,
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
		this.activeBox = null;
		this.activePin = null;
	};

	@action
	public changeCustomConfig = async (config: {[prop: string]: string}, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);
		if (targetBox) {
			targetBox.spec['custom-config'] = config;
		}
	};

	@action
	public deleteParam = (paramName: string, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);
		if (targetBox && targetBox.spec.params) {
			const paramIndex = targetBox?.spec.params.findIndex(param => param.name === paramName);

			if (paramIndex >= 0) {
				const params = [...targetBox?.spec.params.filter(param => param.name !== paramName)];
				const boxIndex = this.boxes.findIndex(box => box.name === boxName);
				this.boxes[boxIndex] = {
					...targetBox,
					spec: {
						pins: targetBox.spec.pins,
						'image-name': targetBox.spec['image-name'],
						'image-version': targetBox.spec['image-version'],
						'node-port': targetBox.spec['node-port'],
						params,
					},
				};

				this.saveBoxChanges(targetBox);
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
		const removableBox = this.boxes.find(box => box.name === boxName);
		if (!removableBox) return;
		const isSuccess = await this.api.sendSchemaRequest(this.selectedSchema, [{
			operation: 'remove',
			payload: removableBox,
		}]);
		if (isSuccess) {
			removableBox.spec.pins.forEach(pin => this.removeConnectionsFromLinkBox(pin, boxName, true));
			this.boxes = observable.array(this.boxes.filter(box => box.name !== boxName));
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
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			const pinIndex = targetBox.spec.pins.findIndex(boxPin => boxPin.name === pin.name);

			if (pinIndex >= 0) {
				targetBox.spec.pins = [
					...targetBox.spec.pins.slice(0, pinIndex),
					pin,
					...targetBox.spec.pins.slice(pinIndex + 1, targetBox.spec.pins.length),
				];
				this.saveBoxChanges(targetBox);
			}
		}
	};

	@action
	public addPinToBox = (pin: Pin, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			targetBox.spec.pins = [...targetBox.spec.pins, pin];
			this.saveBoxChanges(targetBox);
		}
	};

	@action
	public removePinFromBox = (pin: Pin, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			targetBox.spec.pins = [...targetBox.spec.pins.filter(boxPin => boxPin.name !== pin.name)];
			this.removeConnectionsFromLinkBox(pin, boxName, true);
			this.saveBoxChanges(targetBox);
		}
	};

	@action
	private removeConnectionsFromLinkBox = (pin: Pin, boxName: string, full: boolean) => {
		this.links = [...this.links.filter(connection => connection.from.box !== boxName
			|| connection.from.pin !== pin.name)];

		if (full) {
			this.links = [...this.links.filter(connection => connection.to.box !== boxName
				|| connection.to.pin !== pin.name)];
		}

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
			this.removeConnectionsFromLinkBox(pin, boxName, false);

			this.saveBoxChanges(this.linkBox);
		}
	};

	@action
	public deleteConnection = async (connection: Link) => {
		if (this.selectedSchema && this.linkBox) {
			this.links = [...this.links.filter(link => link.from.box !== connection.from.box
				|| link.to.box !== connection.to.box
				|| link.from.pin !== connection.from.pin
				|| link.to.pin !== connection.to.pin),
			];
			if (this.linkBox?.spec['links-definition']) {
				const linkIndex = this.linkBox
					.spec['links-definition'][`router-${connection
						.from.connectionType}` as 'router-mq' | 'router-grpc']
					.findIndex(link => link.name === connection.name);
				this.linkBox
					.spec['links-definition'][`router-${connection
						.from.connectionType}` as 'router-mq' | 'router-grpc']
					.splice(linkIndex, 1);
			}
			if (this.linkBox?.spec['boxes-relation']) {
				const linkIndex = this.linkBox
					.spec['boxes-relation'][`router-${connection
						.from.connectionType}` as 'router-mq' | 'router-grpc']
					.findIndex(link => link.name === connection.name);
				this.linkBox
					.spec['boxes-relation'][`router-${connection
						.from.connectionType}` as 'router-mq' | 'router-grpc']
					.splice(linkIndex, 1);
			}

			this.saveBoxChanges(this.linkBox);
		}
	};

	@action
	public addAttribute = (attribute: string, pinName: string, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			const targetPin = targetBox.spec.pins.find(pin => pin.name === pinName);

			if (targetPin) {
				if (!targetPin.attributes) {
					set(targetPin, { attributes: [attribute] });
					return;
				}
				targetPin.attributes.push(attribute);
				this.saveBoxChanges(targetBox);
			}
		}
	};

	@action
	public removeAttribute = (attribute: string, pinName: string, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			const targetPin = targetBox.spec.pins.find(pin => pin.name === pinName);

			if (targetPin) {
				console.log(targetPin.attributes);
				targetPin.attributes = [...targetPin.attributes.filter(pinAttibute => pinAttibute !== attribute)];
				console.log(targetPin.attributes);
				this.saveBoxChanges(targetBox);
			}
		}
	};

	@action
	public addFilter = (filter: Filter, pinName: string, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			const targetPin = targetBox.spec.pins.find(pin => pin.name === pinName);

			if (targetPin) {
				if (!targetPin.filters) {
					set(targetPin, { filters: [filter] });
					return;
				}
				targetPin.filters.push(filter);
				this.saveBoxChanges(targetBox);
			}
		}
	};

	@action
	public removeFilter = (filter: Filter, pinName: string, boxName: string) => {
		const targetBox = this.boxes.find(box => box.name === boxName);

		if (targetBox) {
			const targetPin = targetBox.spec.pins.find(pin => pin.name === pinName);

			if (targetPin && targetPin.filters) {
				targetPin.filters = [...targetPin.filters.filter(pinFilter => pinFilter
					.metadata[0]['field-name'] !== filter.metadata[0]['field-name']
					|| pinFilter.metadata[0]['expected-value'] !== filter.metadata[0]['expected-value']
					|| pinFilter.metadata[0].operation !== filter.metadata[0].operation)];
				this.saveBoxChanges(targetBox);
			}
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
