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

import { BoxEntity, ExtendedConnectionOwner, isBoxEntity } from '../models/Box';
import { DictionaryEntity } from '../models/Dictionary';
import { isLink, Link } from '../models/LinksDefinition';

export function isFilterPassed(
	element: BoxEntity | Link<ExtendedConnectionOwner> | DictionaryEntity,
	filterString: string,
) {
	let data: Array<string>;

	if (isBoxEntity(element)) {
		data = [
			element.name,
			element.spec['image-name'],
			element.spec['image-version'],
			element.spec.type,
		];
	} else if (isLink(element)) {
		data = [element.name, element.from.box, element.from.pin, element.to.box, element.to.pin];
	} else {
		data = [element.name];
	}

	return data
		.filter(value => typeof value === 'string')
		.map(value => value.toLowerCase())
		.some(value => value.includes(filterString.toLowerCase()));
}
