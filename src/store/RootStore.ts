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
import { BoxEntity } from '../models/Box';
import { intersection } from '../helpers/array';
import LinksDefinition, { isLinksDefinition } from '../models/LinksDefinition';
import Api from '../api/api';
import { isValidBox } from '../helpers/box';

export default class RootStore {
	constructor(private api: Api) {
		reaction(
			() => this.boxes.map(box => box.kind),
			groups => this.groups = [...new Set(groups)],
		);
	}

	@observable
	public schemas: string[] = [];

	@observable
	public activeBox: BoxEntity | null = null;

	@observable
	public boxes: Array<BoxEntity> = [];

	@observable
	public groups: Array<string> = [];

	@observable
	public links: Array<[string, string]> = [];

	@computed
	// todo: unused
	public get connectionChain() {
		if (!this.activeBox) return [];
		const activeBoxConnections = this.activeBox.spec.pins.map(pin => pin['connection-type']);
		const nextBoxes: Array<BoxEntity> = [];
		const previousBoxes: Array<BoxEntity> = [];

		const groupIndex = this.groups.indexOf(this.activeBox.kind);
		for (let i = groupIndex + 1; i < this.groups.length; i++) {
			const nextGroup = this.groups[i];

			const nextGroupBoxes = this.boxes
				.filter(box => box.kind === nextGroup)
				.filter(box => intersection(
					box.spec.pins.map(pin => pin['connection-type']),
					activeBoxConnections,
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
					activeBoxConnections,
				).length !== 0);
			if (!prevGroupBoxes.length) break;
			previousBoxes.unshift(...prevGroupBoxes);
		}

		return [...previousBoxes, this.activeBox, ...nextBoxes];
	}

	@computed
	public get activeLink(): [string, string] | null {
		if (this.activeBox == null) {
			return null;
		}

		return this.links.find(link => link.includes(this.activeBox!.name)) ?? null;
	}

	@action
	public addBox = (box: BoxEntity) => {
		this.boxes.push(box);
	};

	@action
	public setActiveBox = (box: BoxEntity | null) => {
		this.activeBox = box;
	};

	@action
	public setLinks = (links: LinksDefinition[]) => {
		this.links = links.flatMap(link => ([
			...link.spec['links-definition']['router-mq']
				.map<[string, string]>(mqLink => [mqLink.from.box, mqLink.to.box]),
			...link.spec['links-definition']['router-grpc']
				.map<[string, string]>(grpcLink => [grpcLink.from.box, grpcLink.to.box]),
		]));
	};

	@action
	public async fetchSchemas() {
		this.schemas = await this.api.fetchSchemasList();
	}

	@action
	public async fetchSchemaState(schemaName: string) {
		const result = await this.api.fetchSchemaState(schemaName);
		this.boxes = result.filter(resItem => isValidBox(resItem)) as BoxEntity[];
		const links = result.filter(resItem => isLinksDefinition(resItem)) as LinksDefinition[];
		this.setLinks(links);
	}

	async init() {
		await this.fetchSchemas();
		// todo: replace with schema name, selected by user
		await this.fetchSchemaState('master');
	}
}
