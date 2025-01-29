import { useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import "./CustomModal.css";

const CustomModal = ( { title, isVisible, closeOnBackdrop = true, onClose, children, footer } ) => {
	const focusTrapElement = useRef(null);
	const isMouseDownInsideModal = useRef(false);

	// Close the modal
	const closeModal = useCallback(() => {
		if (onClose) {
			onClose();
		}
	}, [onClose]);

	// Handle mouse down to track if the click started inside the modal
	const handleMouseDown = (event) => {
		isMouseDownInsideModal.current = focusTrapElement.current?.contains(event.target);
	};

	// Handle backdrop clicks
	const handleBackdropClick = () => {
		if (closeOnBackdrop && !isMouseDownInsideModal.current) {
			closeModal();
		}
	};

	// Close modal on Escape key press
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				closeModal();
			}
		};
		if (isVisible) {
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isVisible, closeModal]);

	if (!isVisible) return null;

	return (
		<div
			className="modal-overlay"
			onMouseDown={handleMouseDown}
			onClick={handleBackdropClick}
		>
			<div
				className="modal-content"
				onClick={(e) => e.stopPropagation()}
				ref={focusTrapElement}
			>
				<div className="modal-header">
					{title && <h3>{title}</h3>}
					<button className="close-button" onClick={closeModal}>
						&times;
					</button>
				</div>
				<div className="modal-body">{children}</div>
				{footer && <div className="modal-footer">{footer}</div>}
			</div>
		</div>
	);
};

CustomModal.propTypes = {
	title: PropTypes.string,
	isVisible: PropTypes.bool.isRequired,
	closeOnBackdrop: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	children: PropTypes.node.isRequired,
	footer: PropTypes.node,
};

export default CustomModal;
