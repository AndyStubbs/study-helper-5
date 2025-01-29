import PropTypes from "prop-types";
import CustomModal from "@/components/custom/CustomModal";
import "./CustomConfirm.css";

const CustomConfirm = ({
	isVisible,
	title = "Confirm",
	message,
	onConfirm,
	onCancel
}) => {
	return (
		<CustomModal
			title={title}
			isVisible={isVisible}
			onClose={onCancel}
			footer={
				<div className="confirm-footer">
					<button className="confirm-btn" onClick={onConfirm}>Yes</button>
					<button className="confirm-btn cancel" onClick={onCancel}>No</button>
				</div>
			}
		>
			<p>{message}</p>
		</CustomModal>
	);
};

CustomConfirm.propTypes = {
	isVisible: PropTypes.bool.isRequired,
	title: PropTypes.string,
	message: PropTypes.string.isRequired,
	onConfirm: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};

export default CustomConfirm;
