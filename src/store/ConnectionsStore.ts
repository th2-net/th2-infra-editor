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
import LinksDefinition, { Link, LinkArrow } from '../models/LinksDefinition';
import { BoxEntity, Connection, ExtendedConnectionOwner, Pin } from '../models/Box';
import { intersection } from '../helpers/array';
import {
	addAdditionalDetailsToLink,
	convertToExtendedLink,
	convertToOriginLink,
} from '../helpers/link';
import SchemasStore from './SchemasStore';
import RootStore from './RootStore';
import HistoryStore from './HistoryStore';
import { Change } from '../models/History';
import { copyObject } from '../helpers/object';

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
	public outlinerSelectedLink: Link<ExtendedConnectionOwner> | null = null;

	@observable
	public linkBoxes: LinksDefinition[] | null = null;

	@observable
	public connections: Map<string, Map<string, Map<string, Connection>>> = new Map();

	@observable
	public draggableLink: Link<ExtendedConnectionOwner> | null = null;

	@observable
	public connectionBoxStart: BoxEntity | null = null;

	@observable
	public connectionPinStart: Pin | null = null;

	@action setOutlinerSelectedLink = (link: Link<ExtendedConnectionOwner> | null) => {
		this.outlinerSelectedLink = link;
	};

	@action setDraggableLink = (link: Link<ExtendedConnectionOwner> | null) => {
		this.draggableLink = link;
	};

	@action setConnectionStart = (box: BoxEntity | null, pin: Pin | null) => {
		this.connectionBoxStart = box;
		this.connectionPinStart = pin;
	};

	@computed
	public get links(): Link<ExtendedConnectionOwner>[] {
		if (this.linkBoxes === null) return [];

		return this.linkBoxes.flatMap(linkBox => {
			if (linkBox.spec['boxes-relation']) {
				return [
					...(linkBox.spec['boxes-relation']['router-mq']
						? linkBox.spec['boxes-relation']['router-mq'].map(link =>
								convertToExtendedLink(link, 'mq'),
						  )
						: []),
					...(linkBox.spec['boxes-relation']['router-grpc']
						? linkBox.spec['boxes-relation']['router-grpc'].map(link =>
								convertToExtendedLink(link, 'grpc'),
						  )
						: []),
				];
			}
			return [];
		});
	}

	@computed
	public get connectionChain(): BoxEntity[] {
		if (!this.connectionBoxStart || !this.connectionPinStart) return [];
		const boxes: Array<BoxEntity> = [];

		const groupIndex = this.schemasStore.types.indexOf(this.connectionBoxStart.spec.type);

		for (let i = 0; i < this.schemasStore.types.length; i++) {
			if (i === groupIndex) continue;
			const nextGroupBoxes = this.getConnectableBoxes(i);
			if (!nextGroupBoxes.length) continue;
			boxes.push(...nextGroupBoxes);
		}

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
	public addConnections = (connections: [string, string, Connection][]) => {
		connections.forEach(pinConnection => {
			if (!this.connections.has(pinConnection[0])) {
				this.connections.set(pinConnection[0], new Map<string, Map<string, Connection>>());
			}

			if (!this.connections.get(pinConnection[0])?.has(pinConnection[1])) {
				this.connections
					.get(pinConnection[0])
					?.set(pinConnection[1], new Map<string, Connection>());
			}

			this.connections
				.get(pinConnection[0])
				?.get(pinConnection[1])
				?.set(pinConnection[2].name, pinConnection[2]);
		});
	};

	@computed
	public get connectionsArrows(): LinkArrow[] {
		return this.links
			.map(link => {
				const startBox = this.schemasStore.boxes.find(box => box.name === link.from?.box);
				const endBox = this.schemasStore.boxes.find(box => box.name === link.to?.box);
				if (startBox && endBox && link.from && link.to) {
					const startConnection = this.connections
						.get(startBox.name)
						?.get(link.from.pin)
						?.get(link.name);
					const endConnection = this.connections
						.get(endBox.name)
						?.get(link.to.pin)
						?.get(link.name);
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
							isHighlighted: this.schemasStore.activeBox
								? this.schemasStore.activeBox?.name === startBox.name
								: this.outlinerSelectedLink
								? this.outlinerSelectedLink.name === link.name
								: this.schemasStore.outlinerSelectedBox
								? this.schemasStore.outlinerSelectedBox.name === startBox.name
								: false,
							isHidden: this.schemasStore.filterTargetBox
								? startBox.name !== this.schemasStore.filterTargetBox.name &&
								  endBox.name !== this.schemasStore.filterTargetBox.name
								: false,
						};
					}
				}
				return {} as LinkArrow;
			})
			.filter(arrow => arrow.start && arrow.end);
	}

	@action
	public addLink(link: Link<ExtendedConnectionOwner>, createSnapshot = true) {
		if (!this.linkBoxes) return;

		const convertedLink = convertToOriginLink(link);

		let editorGeneratedLinksBox = this.linkBoxes?.find(
			linkBox => linkBox.name === 'editor-generated-links',
		);
		if (editorGeneratedLinksBox && editorGeneratedLinksBox.spec['boxes-relation']) {
			editorGeneratedLinksBox.spec['boxes-relation'][
				`router-${link.from?.connectionType}` as 'router-mq' | 'router-grpc'
			].push(convertedLink);
			this.schemasStore.saveEntityChanges(editorGeneratedLinksBox, 'update');
		} else {
			editorGeneratedLinksBox = {
				kind: 'Th2Link',
				name: 'editor-generated-links',
				spec: {
					'boxes-relation': {
						'router-grpc': link.from?.connectionType === 'grpc' ? [convertedLink] : [],
						'router-mq': link.from?.connectionType === 'mq' ? [convertedLink] : [],
					},
				},
			} as LinksDefinition;
			this.linkBoxes.push(editorGeneratedLinksBox);
			this.schemasStore.saveEntityChanges(editorGeneratedLinksBox, 'add');
		}

		if (createSnapshot) {
			this.historyStore.addSnapshot({
				object: link.name,
				type: 'link',
				operation: 'add',
				changeList: [
					{
						object: link.name,
						from: null,
						to: link,
					},
				],
			});
		}
	}

	@action
	public removeRelatedToPinLinks = (
		pin: Pin,
		boxName: string,
		createSnapshot = true,
	): Change[] => {
		if (!this.linkBoxes) return [];

		const changes = new Array<Change>();

		if (createSnapshot) {
			this.links
				.filter(
					link =>
						(link.from?.box === boxName && link.from.pin === pin.name) ||
						(link.to?.box === boxName && link.to.pin === pin.name),
				)
				.forEach(link => {
					changes.push({
						object: link.name,
						from: link,
						to: null,
					});
				});
		}

		if (this.linkBoxes) {
			this.linkBoxes = this.linkBoxes.map(linkBox => {
				const copyLinkBox = {
					name: linkBox.name,
					kind: linkBox.kind,
					sourceHash: linkBox.sourceHash,
					spec: {
						'boxes-relation': {},
					},
				} as LinksDefinition;

				const mqLinks =
					linkBox.spec['boxes-relation'] && linkBox.spec['boxes-relation']['router-mq']
						? linkBox.spec['boxes-relation']['router-mq'].filter(
								link =>
									!(link.from?.box === boxName && link.from.pin === pin.name) &&
									!(link.to?.box === boxName && link.to.pin === pin.name),
						  )
						: undefined;
				const grpcLinks =
					linkBox.spec['boxes-relation'] && linkBox.spec['boxes-relation']['router-grpc']
						? linkBox.spec['boxes-relation']['router-grpc'].filter(
								link =>
									!(link.from?.box === boxName && link.from.pin === pin.name) &&
									!(link.to?.box === boxName && link.to.pin === pin.name),
						  )
						: undefined;
				if (
					mqLinks &&
					mqLinks.length &&
					linkBox.spec['boxes-relation'] &&
					linkBox.spec['boxes-relation']['router-mq'] &&
					copyLinkBox.spec['boxes-relation']
				) {
					copyLinkBox.spec['boxes-relation']['router-mq'] = mqLinks;
				}
				if (
					grpcLinks &&
					grpcLinks.length &&
					linkBox.spec['boxes-relation'] &&
					linkBox.spec['boxes-relation']['router-grpc'] &&
					copyLinkBox.spec['boxes-relation']
				) {
					copyLinkBox.spec['boxes-relation']['router-grpc'] = grpcLinks;
				}
				return copyLinkBox;
			});
		}
		if (changes.length) {
			this.linkBoxes.forEach(linkBox => {
				this.schemasStore.saveEntityChanges(linkBox, 'update');
			});
		}
		return changes;
	};

	@action
	public deleteLink = async (
		removableLink: Link<ExtendedConnectionOwner>,
		createSnapshot = true,
	) => {
		if (this.schemasStore.selectedSchema && this.linkBoxes) {
			const changedLinkBox = this.defineChangedLinkBox(removableLink);

			if (!changedLinkBox) return;

			if (changedLinkBox.spec['boxes-relation']) {
				const linkIndex = changedLinkBox.spec['boxes-relation'][
					`router-${removableLink.from?.connectionType}` as 'router-mq' | 'router-grpc'
				].findIndex(link => link.name === removableLink.name);
				changedLinkBox.spec['boxes-relation'][
					`router-${removableLink.from?.connectionType}` as 'router-mq' | 'router-grpc'
				].splice(linkIndex, 1);
			}

			if (createSnapshot) {
				this.schemasStore.saveEntityChanges(changedLinkBox, 'update');
				this.historyStore.addSnapshot({
					object: removableLink.name,
					type: 'link',
					operation: 'remove',
					changeList: [
						{
							object: removableLink.name,
							from: removableLink,
							to: null,
						},
					],
				});
			}
		}
	};

	@action
	public changeLink = (
		newLink: Link<ExtendedConnectionOwner>,
		oldLink: Link<ExtendedConnectionOwner>,
		createSnapshot = true,
	) => {
		if (!oldLink || !this.linkBoxes) return;

		this.deleteLink(oldLink, false);
		this.addLink(newLink, false);

		const oldValue = copyObject(oldLink || null);
		const newValue = copyObject(newLink);

		const changeLinkBox = this.defineChangedLinkBox(newLink);

		if (createSnapshot && oldValue && changeLinkBox) {
			this.schemasStore.saveEntityChanges(changeLinkBox, 'update');
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
	};

	@action
	public replaceDestinationBoxForAllRelatedToBoxLinks = (oldBox: string, newBox: string) => {
		if (!this.linkBoxes) return;

		const filteredLinks = this.links.filter(
			link => link.from?.box === oldBox || link.to?.box === oldBox,
		);

		filteredLinks.forEach(link => {
			const renamedLinks = this.replaceDestinationForLink(link, oldBox, newBox);
			this.changeLink(renamedLinks, link, false);
		});
	};

	private replaceDestinationForLink = (
		link: Link<ExtendedConnectionOwner>,
		oldBox: string,
		newBox: string,
	): Link<ExtendedConnectionOwner> => {
		let changedLink = {
			name: link.name,
			from: {
				box: link.from?.box === oldBox ? newBox : link.from?.box,
				pin: link.from?.pin,
				connectionType: link.from?.connectionType,
			},
			to: {
				box: link.to?.box === oldBox ? newBox : link.to?.box,
				pin: link.to?.pin,
				connectionType: link.to?.connectionType,
			},
		} as Link<ExtendedConnectionOwner>;

		changedLink = addAdditionalDetailsToLink(changedLink, {
			fromStrategy: link.from?.strategy,
			toStrategy: link.to?.strategy,
			fromServiceClass: link.from?.['service-class'],
			toServiceClass: link.to?.['service-class'],
		}) as Link<ExtendedConnectionOwner>;

		return changedLink;
	};

	public generateLinkName = (fromBoxName: string, toBoxName: string) => {
		let defaultName = `${fromBoxName}-to-${toBoxName}`;
		const linkNumber = Math.max(
			...this.links
				.filter(link => link.name.includes(defaultName))
				.map(link => {
					const number = link.name.substr(defaultName.length);
					return /\d+/.test(number) ? parseInt(number) : 1;
				}),
		);
		if (linkNumber !== -Infinity) {
			defaultName += `-${linkNumber + 1}`;
		}
		return defaultName;
	};

	private defineChangedLinkBox = (targetLink: Link<ExtendedConnectionOwner>) => {
		return this.linkBoxes?.find(linkBox => {
			const links =
				linkBox.spec['boxes-relation']?.[
					`router-${targetLink.from?.connectionType}` as 'router-mq' | 'router-grpc'
				];
			return links?.some(link => link.name === targetLink.name);
		});
	};
}
