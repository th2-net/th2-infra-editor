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
import { observer } from 'mobx-react-lite';
import { useDropzone } from 'react-dropzone';
import yaml from 'js-yaml';
import Group from './Group';
import SvgLayout from '../SvgLayout';
import useStore from '../../hooks/useStore';
import { isFileBase } from '../../models/FileBase';
import { isLinksDefinition } from '../../models/LinksDefinition';
import { readFileAsText } from '../../helpers/files';
import { isValidBox } from '../../helpers/box';
import '../../styles/group.scss';

const Groups = () => {
	const { rootStore } = useStore();
	const groupsRef = React.useRef<HTMLDivElement>(null);

	const onDrop = React.useCallback(acceptedFiles => {
		parseYamlFiles(acceptedFiles);
	}, []);

	const parseYamlFiles = (files: FileList | File[]) => {
		Array.from(files).forEach(async file => {
			try {
				const fileDataURL = await readFileAsText(file);
				const parsedYamlFile = yaml.safeLoad(fileDataURL);
				if (!isFileBase(parsedYamlFile)) {
					return;
				}

				if (isValidBox(parsedYamlFile)) {
					rootStore.addBox(parsedYamlFile);
				}

				if (isLinksDefinition(parsedYamlFile)) {
					rootStore.setLinks([parsedYamlFile]);
				}
			} catch (error) {
				console.error('error');
			}
		});
	};

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		noClick: true,
	});

	return (
		<div {...getRootProps()} className="groups__wrapper">
			<div ref={groupsRef} className="groups">
				<input {...getInputProps()}/>
				<div
					className="groups__list"
					style={{
						gridTemplateColumns: `repeat(${Math.max(rootStore.groups.length, 6)}, 250px)`,
					}}>
					{
						(rootStore.groups.includes('Th2Connector') || rootStore.groups.includes('Th2Hand'))
						&& <Group
							title={'Th2Connector'}
							boxes={rootStore.boxes
								.filter(box => box.kind === 'Th2Connector' || box.kind === 'Th2Hand')
								.sort((a, b) => (a.name >= b.name ? 1 : -1))}
							groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}/>
					}
					{
						(rootStore.groups.includes('Th2Codec'))
						&& <Group
							title={'Th2Codec'}
							boxes={rootStore.boxes
								.filter(box => box.kind === 'Th2Codec')
								.sort((a, b) => (a.name >= b.name ? 1 : -1))}
							groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}/>
					}
					{
						(rootStore.groups.includes('Th2Act') || rootStore.groups.includes('Th2Verify'))
						&& <Group
							title={'Th2Act'}
							boxes={rootStore.boxes
								.filter(box => box.kind === 'Th2Act' || box.name === 'Th2Verify')
								.sort((a, b) => (a.name >= b.name ? 1 : -1))}
							groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}/>
					}
					{
						rootStore.groups
							.filter(group =>
								!['Th2Connector', 'Th2Hand', 'Th2Codec', 'Th2Act', 'Th2Verify']
									.some(groupName => groupName === group))
							.map(group =>
								<Group
									title={group}
									key={group}
									boxes={rootStore.boxes
										.filter(box => box.kind === group)
										.sort((a, b) => (a.name >= b.name ? 1 : -1))}
									groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}/>)
					}
				</div>
			</div>
			<SvgLayout
				connections={rootStore.connections}
				deleteConnection={rootStore.deleteConnection}
			/>
		</div>
	);
};

export default observer(Groups);
