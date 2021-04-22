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

import fetchIntercept from 'fetch-intercept';
import { v1 } from 'uuid';
import notificationsStore from '../store/NotificationsStore';

export const registerFetchInterceptor = () =>
	fetchIntercept.register({
		request(url, config) {
			return [url, config];
		},
		requestError(error) {
			return Promise.reject(error);
		},
		response(response) {
			if (!response.ok) {
				const { url, status, statusText } = response;
				response.text().then(text => {
					notificationsStore.addMessage({
						type: 'error',
						header: statusText,
						resource: url,
						responseCode: status,
						responseBody: text,
						errorType: 'responseError',
						id: v1(),
					});
				});
			}
			return response;
		},
		responseError(error) {
			return Promise.reject(error);
		},
	});
