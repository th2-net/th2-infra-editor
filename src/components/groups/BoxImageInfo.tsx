/** ****************************************************************************
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

import React from 'react';

interface BoxImageInfoProps {
	spec: {
		['image-name']: string;
		['image-version']: string;
		['node-port']: number;
	};
}

const BoxImageInfo = ({
	spec,
}: BoxImageInfoProps) => (
	<div className="box-settings__image-info">
		{
			Object.entries(spec).map(([key, value]) => (
				value
				&& <div
					key={key}
					className="box-settings__image-info-item">
					<div className='box-settings__label'>{key}</div>
					<div className='box-settings__image-info-value'>{value}</div>
				</div>
			))
		}
	</div>);

export default BoxImageInfo;
