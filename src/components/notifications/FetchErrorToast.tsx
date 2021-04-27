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

import React from 'react';

interface FetchErrorProps {
	header: string;
	resource: string;
	responseCode: number | null;
	responseBody: string;
}

export default function FetchErrorToast(props: FetchErrorProps) {
	const { responseBody, responseCode, header } = props;
	return (
		<div className='toast-content'>
			<div className='toast-content__top'>
				<p className='response-body' title={header}>
					{header}
				</p>
				<p className='response-code'>{responseCode}</p>
			</div>
			<div className='toast-content__middle'>{responseBody}</div>
		</div>
	);
}
