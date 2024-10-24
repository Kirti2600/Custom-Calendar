
import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createHolidayRecord from '@salesforce/apex/HolidayController.createHolidayRecord';

export default class HolidayModal extends LightningElement {
    @api isModalOpen = false;
    @track EmployeeName = '';
    @track holidayStartDate = '';
    @track holidayEndDate = '';
    @track holidayType = '';
    @api employeeName;
    @api startDate;
    @api endDate;
    @api leaveType;
    
    typeOptions = [
        { label: 'Sick Leave ', value: 'Sick Leave' },
        { label: 'Casual Leave', value: 'Casual Leave' },
        { label: 'Earned Leave', value: 'Earned Leave' },
        { label: 'Annual Leave', value: 'Annual Leave' }
    ];

   
    // Close the modal
    handleCloseModal() {
        this.isModalOpen = false;
        const closeEvent = new CustomEvent('closemodal'); // Dispatch close event
        this.dispatchEvent(closeEvent); // Notify parent component
    }


    handleNameChange(event) {
        this.EmployeeName = event.target.value;
    }

    handleStartDateChange(event) {
        this.holidayStartDate = event.target.value;
    }

    handleEndDateChange(event) {
        this.holidayEndDate = event.target.value;
    }

    handleTypeChange(event) {
        this.holidayType = event.target.value;
    }

    handleSave() 
    {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Remove time part for comparison

        // Convert holidayStartDate and holidayEndDate to JavaScript Date objects
        const startDate = new Date(this.holidayStartDate);
        const endDate = new Date(this.holidayEndDate);

        // Validate: Start date cannot be in the past
        if (startDate < today) {
            this.showToast('Error', 'Holiday start date cannot be in the past.', 'error');
            return; // Prevent form submission
        }

        // Validate: End date cannot be before start date
        if (endDate < startDate) {
            this.showToast('Error', 'Holiday end date cannot be before the start date.', 'error');
            return; // Prevent form submission
        }

        if (this.EmployeeName && this.holidayStartDate && this.holidayEndDate && this.holidayType) {
            // Create a new holiday record in Salesforce
            createHolidayRecord({
                EmployeeName: this.EmployeeName,
                holidayStartDate: this.holidayStartDate,
                holidayEndDate: this.holidayEndDate,
                type: this.holidayType
            })
            .then(() => {
                // Create a new holiday event for the calendar
                const newHolidayEvent = {
                    title: this.holidayType,
                    start: this.holidayStartDate,
                    end: this.holidayEndDate
                };

                // Dispatch the event to the parent component
                const event = new CustomEvent('createholiday', { detail: newHolidayEvent });
                this.dispatchEvent(event);

                // Show success toast
                this.showToast('Success', 'Holiday record created successfully', 'success');
                this.handleCloseModal(); // Close modal

                  // Reset form fields
                this.clearForm();

                // After saving the holiday
             //   const refreshEvent = new CustomEvent('refreshevents');
              //  this.dispatchEvent(refreshEvent);
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
        } else {
            this.showToast('Error', 'Please fill in all fields', 'error');
        }
    }
   
    clearForm() {
    this.EmployeeName = '';
    this.holidayStartDate = '';
    this.holidayEndDate = '';
    this.holidayType = '';
    }
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = {
            'Employee_Name__c': this.employeeName,
            'Start_Date__c': this.startDate,
            'End_Date__c': this.endDate,
            'Leave_Type__c': this.leaveType
        };
        const recordInput = { apiName: 'User_Holiday__c', fields };
        createRecord(recordInput)
            .then(() => {
                this.dispatchEvent(new CustomEvent('recordcreated'));
                this.isModalOpen = false;
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
        this.isModalOpen = false;
    }
    // Close the modal
     handleCloseModal() {
    this.isModalOpen = false; // Set modal to closed
    const closeEvent = new CustomEvent('closemodal'); // Dispatch close event
    this.dispatchEvent(closeEvent); // Notify parent component
}
}
