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
 *  limitations under the License.
 ***************************************************************************** */

import { action, computed, observable } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import LinksDefinition, { Link } from '../models/LinksDefinition';
import {
	BoxConnections,
	BoxEntity,
	BoxEntityWrapper,
	ConnectionArrow,
	ConnectionOwner,
	Pin,
} from '../models/Box';
import { intersection } from '../helpers/array';
import { convertLinks } from '../helpers/link';
import SchemasStore from './SchemasStore';
import RootStore from './RootStore';
import HistoryStore from './HistoryStore';
import { Change } from '../models/History';

export default class ConnectionsStore {
	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		private schemasStore:
			SchemasStore,
		private historyStore: HistoryStore,
	) { }

	@observable
	public selectedLink: string | null = null;

	@observable
	public outlinerSelectedLink: string | null = null;

	@observable
	public links: Array<Link> = observable.array<Link>([]);

	@observable
	public linkBox: LinksDefinition | null = null;

	@observable
	public connectionCoords: Array<[ConnectionOwner, BoxConnections]> = [];

	@action setSelectedLink = (link: string | null) => {
		this.selectedLink = link;
	};

	@action setOutlinerSelectedLink = (link: string | null) => {
		this.outlinerSelectedLink = link;
	};

	@action
	public setLinks = (links: LinksDefinition[]) => {
		this.links = links.flatMap(link => {
			if (link.spec['boxes-relation']) {
				return [
					...convertLinks(link.spec['boxes-relation']['router-mq'], 'mq'),
					...convertLinks(link.spec['boxes-relation']['router-grpc'], 'grpc'),
				];
			}
			return [];
		});
	};

	@computed
	public get connectionChain(): BoxEntityWrapper[] {
		if (!this.schemasStore.activeBox || !this.schemasStore.activePin) return [];
		const boxes: Array<BoxEntity> = [];

		const groupIndex = this.schemasStore.kinds.indexOf(this.schemasStore.activeBox.kind);

		for (let i = 0; i < this.schemasStore.kinds.length; i++) {
			// eslint-disable-next-line no-continue
			if (i === groupIndex) continue;
			const nextGroupBoxes = this.getConnectableBoxes(i);
			if (!nextGroupBoxes.length) break;
			boxes.push(...nextGroupBoxes);
		}

		const activeBoxCoords = this.connectionCoords.find(coord => coord[0].box === this.schemasStore.activeBox?.name);

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
		const group = this.schemasStore.kinds[index];
		return this.schemasStore.boxes
			.filter(box => box.kind === group)
			.filter(box => intersection(
				box.spec.pins.map(pin => pin['connection-type']),
				this.schemasStore.activePin
					? [this.schemasStore.activePin?.['connection-type']]
					: this.schemasStore.activeBox
						? this.schemasStore.activeBox.spec.pins.map(pin => pin['connection-type'])
						: [],
			).length !== 0);
	}

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
			const startBox = this.schemasStore.boxes.find(box => box.name === link.from.box);
			const endBox = this.schemasStore.boxes.find(box => box.name === link.to.box);
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
	public setConnection = async (
		connectionName: string,
		pinName: string, connectionType: 'mq' | 'grpc',
		boxName: string,
		options?: {
			createSnapshot?: boolean;
			fromBox: string;
			fromPin: string;
		},
	) => {
		if (!this.schemasStore.selectedSchema
			|| (!this.schemasStore.activeBox && (options && !options.fromBox))
			|| (!this.schemasStore.activePin && (options && !options.fromPin))
			|| !this.linkBox) return;

		const link = {
			name: connectionName,
			from: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				box: options?.fromBox ?? this.schemasStore.activeBox!.name,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				pin: options?.fromPin ?? this.schemasStore.activePin!.name,
				connectionType,
			},
			to: {
				box: boxName,
				pin: pinName,
				connectionType,
			},
		};
		this.links.push(link);

		const newConnection = {
			name: connectionName,
			from: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				box: options?.fromBox ?? this.schemasStore.activeBox!.name,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				pin: options?.fromPin ?? this.schemasStore.activePin!.name,
			},
			to: {
				box: boxName,
				pin: pinName,
			},
		};
		if (this.linkBox.spec['boxes-relation']) {
			this.linkBox.spec['boxes-relation'][(`router-${connectionType}` as 'router-mq' | 'router-grpc')]
				.push(newConnection);
		}
		this.schemasStore.activeBox = null;
		this.schemasStore.activePin = null;
		this.schemasStore.saveBoxChanges(this.linkBox, 'update');
		if ((options && options.createSnapshot) || !options) {
			this.historyStore.addSnapshot({
				object: connectionName,
				type: 'link',
				operation: 'add',
				changeList: [
					{
						object: connectionName,
						from: null,
						to: link,
					},
				],
			});
		}
	};

	@action
	public removeConnectionsFromLinkBox = (
		pin: Pin,
		boxName: string,
		createSnapshot = true,
	): Change[] => {
		if (!this.linkBox) return [];

		const changes = new Array<Change>();

		if (createSnapshot) {
			this.links.filter(connection => (connection.from.box === boxName && connection.from.pin === pin.name)
			|| (connection.to.box === boxName && connection.to.pin === pin.name))
				.forEach(connection => {
					changes.push({
						object: connection.name,
						from: connection,
						to: null,
					});
				});
		}

		this.links = [...this.links.filter(connection =>
			(connection.from.box !== boxName && connection.from.pin !== pin.name)
			|| (connection.to.box !== boxName && connection.to.pin !== pin.name))];

		if (this.linkBox?.spec['boxes-relation']) {
			this.linkBox
				// eslint-disable-next-line max-len
				.spec['boxes-relation'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')] = [...this.linkBox
					.spec['boxes-relation'][(`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc')]
					.filter(connection =>
						connection.from.pin !== pin.name
						&& connection.from.box !== boxName)];
		}
		return changes;
	};

	@action
	public deleteConnection = async (connection: Link, createSnapshot = true) => {
		if (this.schemasStore.selectedSchema && this.linkBox) {
			this.links = [...this.links.filter(link => link.from.box !== connection.from.box
				|| link.to.box !== connection.to.box
				|| link.from.pin !== connection.from.pin
				|| link.to.pin !== connection.to.pin),
			];
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

			this.schemasStore.saveBoxChanges(this.linkBox, 'update');
			if (createSnapshot) {
				this.historyStore.addSnapshot({
					object: connection.name,
					type: 'link',
					operation: 'remove',
					changeList: [
						{
							object: connection.name,
							from: connection,
							to: null,
						},
					],
				});
			}
		}
	};
}
