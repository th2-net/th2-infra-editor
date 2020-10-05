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
import { createBemBlock } from '../../helpers/styleCreators';
import { useInput } from '../../hooks/useInput';

interface DictionaryXMLEditorProps {
	xmlContent: string;
	setDictionaryData: (dictionaryData: {
		value: string;
		isValid: boolean;
	}) => void;
}

const DictionaryXMLEditor = ({
	xmlContent,
	setDictionaryData,
}: DictionaryXMLEditorProps) => {
	const isXMLValid = (xml: string) => {
		const parser = new DOMParser();
		const theDom = parser.parseFromString(xml, 'application/xml');
		if (theDom.getElementsByTagName('parsererror').length > 0) {
			return false;
		}
		return true;
	};

	const xmlInputConfig = useInput({
		initialValue: xmlContent,
		id: 'xml-editor',
		validate: isXMLValid,
	});

	const editorClass = createBemBlock(
		'xml-editor',
		!xmlInputConfig.isValid ? 'invalid' : null,
	);

	React.useEffect(() => {
		setDictionaryData({
			value: xmlInputConfig.value,
			isValid: isXMLValid(xmlInputConfig.value),
		});
	}, [xmlInputConfig.value]);

	return (
		<textarea
			{...xmlInputConfig.bind}
			className={editorClass} />
	);
};

export default DictionaryXMLEditor;
