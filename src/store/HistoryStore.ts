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

import { action, computed, observable } from 'mobx';
import { isBoxEntity } from '../models/Box';
import { isDictionaryEntity } from '../models/Dictionary';
import { Change, Snapshot } from '../models/History';
import { isLink } from '../models/LinksDefinition';
import Stack from '../models/Stack';
import RootStore from './RootStore';

export default class HistoryStore {
	constructor(private rootStore: RootStore) {
		this.historyStack = new Stack<Snapshot>();
	}

	@observable
	private historyStack: Stack<Snapshot>;

	@observable
	public lastAppliedSnapshot: Snapshot | null = null;

	@computed
	public get history(): Snapshot[] {
		return this.historyStack.storage;
	}

	@action
	public addSnapshot = (snapshot: Snapshot) => {
		this.historyStack.push(snapshot);
	};

	@action
	public toPreviousSnapshot = () => {
		const snapshot = this.historyStack.getPreviousElement();
		if (snapshot) {
			snapshot.changeList.forEach(change => this.rollbackChange(change));
			this.lastAppliedSnapshot = this.historyStack.storage[this.historyStack.pointer];
		}
	};

	@action
	public toNextSnapshot = () => {
		const snapshot = this.historyStack.getNextElement();
		if (snapshot) {
			snapshot.changeList.forEach(change => this.applyChange(change));
			this.lastAppliedSnapshot = this.historyStack.storage[this.historyStack.pointer];
		}
	};

	@action
	private rollbackChange = (change: Change) => {
		if (!change.from && change.to) {
			if (isBoxEntity(change.to)) {
				this.rootStore.schemaStore.deleteBox(change.to.name, false);
			}
			if (isLink(change.to)) {
				this.rootStore.schemaStore.connectionStore.deleteLink(change.to, false);
			}
			if (isDictionaryEntity(change.to)) {
				this.rootStore.schemaStore.deleteDictionary(change.to.name, false);
			}
			return;
		}
		if (!change.to && change.from) {
			if (isBoxEntity(change.from)) {
				this.rootStore.schemaStore.createBox(change.from, false);
			}
			if (isLink(change.from)) {
				this.rootStore.schemaStore
					.connectionStore.createLink(
						change.object,
						change.from.to.pin,
						change.from.to.connectionType as 'mq' | 'grpc',
						change.from.to.box,
						{
							createSnapshot: false,
							fromBox: change.from.from.box,
							fromPin: change.from.from.pin,
						},
					);
			}
			if (isDictionaryEntity(change.from)) {
				this.rootStore.schemaStore.createDictionary(change.from, false);
			}
			return;
		}
		if (isBoxEntity(change.from) && isBoxEntity(change.to)) {
			this.rootStore.schemaStore.boxes = observable.array([
				...this.rootStore.schemaStore.boxes.filter(box => box.name !== change.from?.name),
				change.from,
			]);
		}
		if (isLink(change.from) && isLink(change.to)) {
			this.rootStore.schemaStore.connectionStore.changeLink(change.from, change.to, false);
		}
		if (isDictionaryEntity(change.from) && isDictionaryEntity(change.to)) {
			this.rootStore.schemaStore.configurateDictionary(change.from);
		}
	};

	@action
	private applyChange = (change: Change) => {
		if (!change.from) {
			if (isBoxEntity(change.to)) {
				this.rootStore.schemaStore.createBox(change.to, false);
			}
			if (isLink(change.to)) {
				this.rootStore.schemaStore
					.connectionStore.createLink(
						change.object,
						change.to.to.pin,
						change.to.from.connectionType as 'mq' | 'grpc',
						change.to.to.box,
						{
							createSnapshot: false,
							fromBox: change.to.from.box,
							fromPin: change.to.from.pin,
						},
					);
			}
			if (isDictionaryEntity(change.to)) {
				this.rootStore.schemaStore
					.createDictionary(change.to, false);
			}
			return;
		}
		if (!change.to) {
			if (isBoxEntity(change.from)) {
				this.rootStore.schemaStore.deleteBox(change.from.name, false);
			}
			if (isLink(change.from)) {
				this.rootStore.schemaStore.connectionStore.deleteLink(change.from, false);
			}
			if (isDictionaryEntity(change.from)) {
				this.rootStore.schemaStore
					.deleteDictionary(change.from.name, false);
			}
			return;
		}
		if (isBoxEntity(change.from) && isBoxEntity(change.to)) {
			this.rootStore.schemaStore.boxes = observable.array([
				...this.rootStore.schemaStore.boxes.filter(box => box.name !== change.from?.name),
				change.to,
			]);
		}
		if (isLink(change.from) && isLink(change.to)) {
			this.rootStore.schemaStore.connectionStore.changeLink(change.to, change.from, false);
		}
		if (isDictionaryEntity(change.from) && isDictionaryEntity(change.to)) {
			this.rootStore.schemaStore.configurateDictionary(change.to);
		}
	};

	@action
	public clearHistory = () => {
		this.historyStack.clear();
	};
}
