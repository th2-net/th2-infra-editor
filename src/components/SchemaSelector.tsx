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

import React from 'react';
import useStore from '../hooks/useStore';

interface SchemaSelectorProps {
	schemaList: string[];
	selectedSchema: string;
}

const SchemaSelector = ({
	schemaList,
	selectedSchema,
}: SchemaSelectorProps) => {
	const { rootStore } = useStore();

	return (
		<select
			className='select'
			onChange={e => rootStore.setSelectedSchema(e.target.value)}
			value={selectedSchema}
		>
			{
				schemaList.map(schema => (
					<option
						key={schema}
						value={schema}>
						{schema}
					</option>
				))
			}
		</select>
	);
};

export default SchemaSelector;
