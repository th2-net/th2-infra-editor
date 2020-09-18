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
	set,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { isValidBox } from '../helpers/box';
import {
	BoxEntity,
	DictionaryRelation,
	Filter,
	Pin,
} from '../models/Box';
import FileBase from '../models/FileBase';
import LinksDefinition, { isLinksDefinition } from '../models/LinksDefinition';
import ConnectionsStore from './ConnectionsStore';
import RootStore from './RootStore';

export default class SchemasStore {
	public connectionStore: ConnectionsStore;

	constructor(private rootStore: RootStore, private api: ApiSchema) {
		this.connectionStore = new ConnectionsStore(rootStore, api, this);

		reaction(
			() => this.boxes.map(box => box.kind),
			groups => this.groups = [...new Set(groups)],
		);

		reaction(
			() => this.selectedSchema,
			selectedSchema => {
				this.connectionStore.connectionCoords = [];
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
	public groups: Array<string> = [];

	@observable
	public changedBoxes: Array<FileBase> = [];

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
	public changeCustomConfig = async (config: { [prop: string]: string }, boxName: string) => {
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
			removableBox.spec.pins
				.forEach(pin => this.connectionStore.removeConnectionsFromLinkBox(pin, boxName, true));
			this.boxes = observable.array(this.boxes.filter(box => box.name !== boxName));
		}
	};

	@action
	public saveBoxChanges = (updatedBox: BoxEntity | LinksDefinition) => {
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
			this.connectionStore.removeConnectionsFromLinkBox(pin, boxName, true);
			this.saveBoxChanges(targetBox);
		}
	};

	@action
	public deletePinConnections = async (pin: Pin, boxName: string) => {
		if (this.selectedSchema && this.connectionStore.linkBox) {
			this.connectionStore.removeConnectionsFromLinkBox(pin, boxName, false);

			this.saveBoxChanges(this.connectionStore.linkBox);
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
				set(targetPin, {
					attributes: [...targetPin.attributes
						.filter(pinAttibute => pinAttibute !== attribute)],
				});
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
}
