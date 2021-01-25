import React from 'react';
import { createLink } from '../../helpers/link';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import { useInput } from '../../hooks/useInput';
import useSchemasStore from '../../hooks/useSchemasStore';
import { useSelect } from '../../hooks/useSelect';
import { ExtendedConnectionOwner } from '../../models/Box';
import FormModal from '../util/FormModal';

interface LinkCreateModalProps {
	defaultName: string;
	from: ExtendedConnectionOwner;
	to: ExtendedConnectionOwner;
	extended: boolean;
	close: () => void;
}

const LinkCreateModal = ({ defaultName, from, to, extended, close }: LinkCreateModalProps) => {
	const connectionsStore = useConnectionsStore();
	const schemasStore = useSchemasStore();

	const linkNameInput = useInput({
		initialValue: defaultName,
		id: 'link-name',
		label: 'name',
		validate: linkName => !connectionsStore.links.find(link => link.name === linkName),
	});

	const linkFromStrategySelect = useSelect({
		variants: ['robin', 'filter'],
		id: 'from-link-strategy',
		label: 'from-strategy',
	});

	const linkToStrategySelect = useSelect({
		variants: ['robin', 'filter'],
		id: 'to-link-strategy',
		label: 'from-strategy',
	});

	const linkFromServiceClassSelect = useSelect({
		variants: ['com.exactpro.th2.util.grpc.MessageComparatorServiceService'],
		id: 'from-link-service-class',
		label: 'from-service-class',
	});

	const linkToServiceClassSelect = useSelect({
		variants: ['com.exactpro.th2.util.grpc.MessageComparatorServiceService'],
		id: 'to-link-service-class',
		label: 'to-service-class',
	});

	const onSubmit = () => {
		if (!schemasStore.activeBox || !schemasStore.activePin) return;

		const fromPosition = from;
		const toPosition = to;

		if (extended) {
			fromPosition.strategy = linkFromStrategySelect.value;
			toPosition.strategy = linkToStrategySelect.value;
			fromPosition['service-class'] = linkFromServiceClassSelect.value;
			toPosition['service-class'] = linkToServiceClassSelect.value;
		}

		const link = createLink(linkNameInput.value, fromPosition, toPosition);
		connectionsStore.addLink(link);
		schemasStore.setActiveBox(null);
		schemasStore.setActivePin(null);
	};

	const inputs = [
		linkNameInput,
		...(extended
			? [
					linkFromStrategySelect,
					linkToStrategySelect,
					linkFromServiceClassSelect,
					linkToServiceClassSelect,
			  ]
			: []),
	];

	return (
		<FormModal
			title={'Create link'}
			configList={inputs}
			onSubmit={() => {
				onSubmit();
				close();
			}}
			onClose={close}
		/>
	);
};

export default LinkCreateModal;
