import { LightningElement, api } from 'lwc';

export default class LeaveDetailsModal extends LightningElement {
    @api isModalOpen = false; // Control modal visibility
    @api employeeName = ''; // Employee name to display
    @api leaveType = ''; // Leave type to display

    // Close the modal
    handleCloseModal() {
        this.isModalOpen = false;
        const closeEvent = new CustomEvent('closemodal');
        this.dispatchEvent(closeEvent); // Dispatch event to parent to notify modal close
        //   this.dispatchEvent(new CustomEvent('close'));
    }
    
}