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
import AceEditor, { IAceEditorProps } from 'react-ace';
import { createBemBlock } from '../../helpers/styleCreators';
import { InputConfig } from '../../hooks/useInput';

import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/ext-language_tools';

const defaultJSONEditorProps: IAceEditorProps = {
	mode: 'json',
	theme: 'textmate',
	name: 'config-editor',
	fontSize: 12,
	width: 'auto',
	height: '300px',
	showGutter: false,
	highlightActiveLine: true,
	tabSize: 4,
	setOptions: {
		enableBasicAutocompletion: true,
	},
} as const;

interface ConfigEditor {
	inputConfig: InputConfig;
}

const JSONEditor = ({ inputConfig }: ConfigEditor) => {
	const textAreaClass = createBemBlock('textarea', !inputConfig.isValid ? 'invalid' : null);

	return (
		<div className='textarea-wrapper'>
			<label htmlFor={inputConfig.bind.name} className='textarea-label'>
				{inputConfig.label}
			</label>
			<AceEditor
				{...defaultJSONEditorProps}
				className={textAreaClass}
				onChange={value => inputConfig.setValue(value)}
				value={inputConfig.value}
			/>
		</div>
	);
};

export default JSONEditor;