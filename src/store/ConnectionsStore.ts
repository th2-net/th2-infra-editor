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

import { action, computed, observable, reaction } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import LinksDefinition, { Link } from '../models/LinksDefinition';
import { BoxEntity, Connection, LinkArrow, Pin } from '../models/Box';
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
		private schemasStore: SchemasStore,
		private historyStore: HistoryStore,
	) {
		reaction(
			() => schemasStore.activeBox,
			activeBox => (this.connectionBoxStart = activeBox),
		);

		reaction(
			() => schemasStore.activePin,
			activePin => (this.connectionPinStart = activePin),
		);
	}

	@observable
	public selectedLink: string | null = null;

	@observable
	public outlinerSelectedLink: string | null = null;

	@observable
	public links: Array<Link> = observable.array<Link>([]);

	@observable
	public linkBox: LinksDefinition | null = null;

	@observable
	public connections: Array<Connection> = [];

	@observable
	public draggableLink: Link | null = null;

	@observable
	public connectionBoxStart: BoxEntity | null = null;

	@observable
	public connectionPinStart: Pin | null = null;

	@action setSelectedLink = (link: string | null) => {
		this.selectedLink = link;
	};

	@action setOutlinerSelectedLink = (link: string | null) => {
		this.outlinerSelectedLink = link;
	};

	@action setDraggableLink = (link: Link | null) => {
		this.draggableLink = link;
	};

	@action setConnectionStart = (box: BoxEntity | null, pin: Pin | null) => {
		this.connectionBoxStart = box;
		this.connectionPinStart = pin;
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
	public get connectionChain(): BoxEntity[] {
		if (!this.connectionBoxStart || !this.connectionPinStart) return [];
		const boxes: Array<BoxEntity> = [];

		const groupIndex = this.schemasStore.types.indexOf(this.connectionBoxStart.spec.type);

		for (let i = 0; i < this.schemasStore.types.length; i++) {
			// eslint-disable-next-line no-continue
			if (i === groupIndex) continue;
			const nextGroupBoxes = this.getConnectableBoxes(i);
			// eslint-disable-next-line no-continue
			if (!nextGroupBoxes.length) continue;
			boxes.push(...nextGroupBoxes);
		}

		const activeBoxCoords = this.connections.find(
			connection => connection.connectionOwner.box === this.connectionBoxStart?.name,
		);

		if (!activeBoxCoords) return [];

		return boxes;
	}

	private getConnectableBoxes(index: number) {
		const group = this.schemasStore.types[index];
		return this.schemasStore.boxes
			.filter(box => box.spec.type === group)
			.filter(
				box =>
					intersection(
						box.spec.pins ? box.spec.pins.map(pin => pin['connection-type']) : [],
						this.connectionPinStart
							? [this.connectionPinStart?.['connection-type']]
							: this.connectionBoxStart && this.connectionBoxStart.spec.pins
							? this.connectionBoxStart.spec.pins.map(pin => pin['connection-type'])
							: [],
					).length !== 0,
			);
	}

	@action
	public addConnection = (connections: Connection[]) => {
		if (!connections.length) return;
		connections.forEach(pinConnection => {
			const coordIndex = this.connections.findIndex(
				coonection =>
					coonection.connectionOwner.box === pinConnection.connectionOwner.box &&
					coonection.connectionOwner.pin === pinConnection.connectionOwner.pin &&
					coonection.name === pinConnection.name,
			);
			if (coordIndex === -1) {
				this.connections.push(pinConnection);
			} else {
				this.connections.splice(coordIndex, 1, pinConnection);
			}
		});
	};

	@computed
	public get connectionsArrows(): LinkArrow[] {
		if (!this.connections.length) return [];
		return this.links
			.map(link => {
				const startBox = this.schemasStore.boxes.find(box => box.name === link.from.box);
				const endBox = this.schemasStore.boxes.find(box => box.name === link.to.box);
				if (startBox && endBox) {
					const startConnection = this.connections.find(
						connection =>
							connection.connectionOwner.box === startBox.name &&
							connection.connectionOwner.pin === link.from.pin &&
							connection.name === link.name,
					);
					const endConnection = this.connections.find(
						connection =>
							connection.connectionOwner.box === endBox.name &&
							connection.connectionOwner.pin === link.to.pin &&
							connection.name === link.name,
					);
					if (startConnection && endConnection) {
						return {
							name: link.name,
							start:
								startConnection.coords.rightPoint.left <
								endConnection.coords.rightPoint.left
									? startConnection.coords.rightPoint
									: startConnection.coords.leftPoint,
							end:
								startConnection.coords.rightPoint.left <=
								endConnection.coords.rightPoint.left
									? endConnection.coords.leftPoint
									: endConnection.coords.rightPoint,
						};
					}
				}
				return {} as LinkArrow;
			})
			.filter(arrow => arrow.start && arrow.end);
	}

	@action
	public createLink = async (
		connectionName: string,
		pinName: string,
		connectionType: 'mq' | 'grpc',
		boxName: string,
		options?: {
			createSnapshot?: boolean;
			fromBox?: string;
			fromPin?: string;
		},
	) => {
		if (
			!this.schemasStore.selectedSchema ||
			(!this.schemasStore.activeBox && options && !options.fromBox) ||
			(!this.schemasStore.activePin && options && !options.fromPin) ||
			!this.linkBox
		)
			return;

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
			this.linkBox.spec['boxes-relation'][
				`router-${connectionType}` as 'router-mq' | 'router-grpc'
			].push(newConnection);
		}
		this.schemasStore.activeBox = null;
		this.schemasStore.activePin = null;
		if ((options && options.createSnapshot) || !options) {
			this.schemasStore.saveEntityChanges(this.linkBox, 'update');
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
			this.links
				.filter(
					connection =>
						(connection.from.box === boxName && connection.from.pin === pin.name) ||
						(connection.to.box === boxName && connection.to.pin === pin.name),
				)
				.forEach(connection => {
					changes.push({
						object: connection.name,
						from: connection,
						to: null,
					});
				});
		}

		this.links = [
			...this.links.filter(
				connection =>
					(connection.from.box !== boxName && connection.from.pin !== pin.name) ||
					(connection.to.box !== boxName && connection.to.pin !== pin.name),
			),
		];

		if (this.linkBox?.spec['boxes-relation']) {
			// eslint-disable-next-line max-len
			this.linkBox.spec['boxes-relation'][
				`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc'
			] = [
				...this.linkBox.spec['boxes-relation'][
					`router-${pin['connection-type']}` as 'router-mq' | 'router-grpc'
				].filter(
					connection =>
						connection.from.pin !== pin.name && connection.from.box !== boxName,
				),
			];
		}
		return changes;
	};

	@action
	public deleteLink = async (connection: Link, createSnapshot = true) => {
		if (this.schemasStore.selectedSchema && this.linkBox) {
			this.links = [
				...this.links.filter(
					link =>
						link.from.box !== connection.from.box ||
						link.to.box !== connection.to.box ||
						link.from.pin !== connection.from.pin ||
						link.to.pin !== connection.to.pin,
				),
			];
			if (this.linkBox?.spec['boxes-relation']) {
				const linkIndex = this.linkBox.spec['boxes-relation'][
					`router-${connection.from.connectionType}` as 'router-mq' | 'router-grpc'
				].findIndex(link => link.name === connection.name);
				this.linkBox.spec['boxes-relation'][
					`router-${connection.from.connectionType}` as 'router-mq' | 'router-grpc'
				].splice(linkIndex, 1);
			}

			if (createSnapshot) {
				this.schemasStore.saveEntityChanges(this.linkBox, 'update');
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

	@action
	public changeLink = (newLink: Link, oldLink?: Link, createSnapshot = true) => {
		if (!(this.draggableLink || oldLink) || !this.linkBox) return;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.deleteLink(oldLink || this.draggableLink!, false);
		this.createLink(newLink.name, newLink.to.pin, newLink.from.connectionType, newLink.to.box, {
			createSnapshot: false,
			fromBox: newLink.from.box,
			fromPin: newLink.from.pin,
		});

		const oldValue = JSON.parse(JSON.stringify(oldLink || this.draggableLink)) as Link;
		const newValue = JSON.parse(JSON.stringify(newLink)) as Link;

		if (createSnapshot) {
			this.schemasStore.saveEntityChanges(this.linkBox, 'update');
			this.historyStore.addSnapshot({
				object: oldValue.name,
				type: 'link',
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

		this.schemasStore.activeBox = null;
		this.schemasStore.activePin = null;
		this.draggableLink = null;
	};

	public generateLinkName = (fromBoxName: string, toBoxName: string) => {
		let defaultName = `${fromBoxName}-${toBoxName}`;
		const connectionNumber = Math.max(
			...this.links
				.filter(link => link.name.includes(defaultName))
				.map(link => {
					const number = link.name.substr(defaultName.length);
					return /\d+/.test(number) ? parseInt(number) : 1;
				}),
		);
		if (connectionNumber !== -Infinity) {
			defaultName += `-${connectionNumber + 1}`;
		}
		return defaultName;
	};
}
