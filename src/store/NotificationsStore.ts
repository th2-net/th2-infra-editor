/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { action, observable } from 'mobx';
import { AppearanceTypes } from 'react-toast-notifications';

interface BaseNotificationError {
	type: AppearanceTypes;
	errorType: 'responseError';
	id: string;
}
export interface ResponseError extends BaseNotificationError {
	errorType: 'responseError';
	resource: string;
	header: string;
	responseBody: string;
	responseCode: number | null;
}

export type NotificationError = ResponseError;

export class NotificationsStore {
	@observable
	public errors: NotificationError[] = [];

	@action
	public addMessage = (error: NotificationError) => {
		if (
			!this.errors.find(
				err =>
					err.header === error.header &&
					err.responseCode === error.responseCode &&
					err.responseBody === error.responseBody,
			)
		)
			this.errors = [...this.errors, error];
	};

	@action
	public deleteMessage = (error: NotificationError | string) => {
		if (typeof error === 'string') {
			this.errors = this.errors.filter(e => e.id !== error);
		} else {
			this.errors = this.errors.filter(e => e !== error);
		}
	};
}

const notificationsStore = new NotificationsStore();

export default notificationsStore;
