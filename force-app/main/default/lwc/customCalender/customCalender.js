import { LightningElement, track, api} from 'lwc';
import getLeavesData from '@salesforce/apex/CustomCalendarController.getLeavesData';
import FullCalendarJS from '@salesforce/resourceUrl/Fullcalendar';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import { NavigationMixin } from "lightning/navigation";

export default class CustomCalendar extends NavigationMixin(LightningElement) {
    @api isModalOpen = false;
    calendar;
    calendarTitle;
    objectApiName = 'User Holiday';
    @track events = []; // Array to hold all calendar events
  //  @track isHolidayModalOpen = false;

    @track isLeaveDetailsModalOpen = false;
    @track employeeName;
    @track leaveType;
    @track events = [];
    @track holidayColors = {}; // Object to hold holiday color mapping
     
     // Define colors
     colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#9B59B6', '#E67E22']; // Example color array
     defaultColor = '#7D7D7D'; // Default color if no specific color is assigned

    // Function to generate unique key
    generateUniqueKey(startDate, endDate) {
        return `${startDate}_${endDate}`;
    }

    // Function to map holidays to colors
     mapHolidaysToColors(holidays) {
        const holidayColorMap = {};
        const uniqueKeys = new Set(); // To keep track of unique keys

        holidays.forEach((holiday, index) => {
            const key = generateUniqueKey(holiday.startDate, holiday.endDate);
            
            if (!uniqueKeys.has(key)) {
                uniqueKeys.add(key);
                // Assign color based on the index, cycling through the colors array
                holidayColorMap[key] = index < colors.length ? colors[index] : defaultColor;
            }
        });

        return holidayColorMap;
    }
 
    viewOptions = [
        { label: 'Day', viewName: 'timeGridDay', checked: false },
        { label: 'Week', viewName: 'timeGridWeek', checked: false },
        { label: 'Month', viewName: 'dayGridMonth', checked: true },
        { label: 'Table', viewName: 'listView', checked: false }
    ];

    // Change calendar view handler
    
     changeViewHandler(event) {
        const viewName = event.detail.value;
        if(viewName != 'listView') {
            this.calendar.changeView(viewName);
            const viewOptions = [...this.viewOptions];
            for(let viewOption of viewOptions) {
                viewOption.checked = false;
                if(viewOption.viewName === viewName) {
                    viewOption.checked = true;
                }
            }
            this.viewOptions = viewOptions;
            this.calendarTitle = this.calendar.view.title;
        } else {
            this.handleListViewNavigation(this.objectApiName);
        }
    }


    // Navigate to ListView
    handleListViewNavigation(objectName) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: objectName,
                actionName: 'list'
            },
            state: {
                filterName: 'Recent'
            }
        });
    }

    // Handle calendar actions (previous, next, today, new, refresh)
    calendarActionsHandler(event) {
        const actionName = event.target.value;
        if (actionName === 'previous') this.calendar.prev();
        else if (actionName === 'next') this.calendar.next();
        else if (actionName === 'today') this.calendar.today();
        else if (actionName === 'new') this.navigateToNewRecordPage(this.objectApiName);
        
        this.calendarTitle = this.calendar.view.title;
    }

    navigateToNewRecordPage(objectName) {
        this[NavigationMixin.Navigate]({
            type: "standard__objectPage",
            attributes: {
                objectApiName: objectName,
                actionName: "new"
            }
        });
    }

    // Initialize calendar
    connectedCallback() {
        Promise.all([
            loadStyle(this, FullCalendarJS + '/lib/main.css'),
            loadScript(this, FullCalendarJS + '/lib/main.js')
        ])
        .then(() => {
            this.fetchAndInitializeCalendar();
        })
        .catch(error => console.error(error));
    }

    // Fetch events from Salesforce and initialize the calendar
    fetchAndInitializeCalendar() {
        getLeavesData()
        .then((result) => {
            

            // Corrected mapping of Salesforce data to events array
            this.events = result.map(holiday => ({
                id: holiday.Name,
                title: holiday.Type__c,
                start: holiday.Start_Date__c,
                end: holiday.End_Date__c,
                extendedProps: {
                employeeName: holiday.Employee__r ? holiday.Employee__r.Name : 'Unknown Employee' // Fallback for undefined employee name
            }
                
            }));

            // Map holidays to colors
            this.holidayColors = mapHolidaysToColors(result);

            // Initialize FullCalendar with the fetched events
            this.initializeCalendar();
        })
        .catch(error => {
            console.error('Error fetching leaves data: ', error);
        });
    }

    // Initialize the FullCalendar with events
    initializeCalendar() {
        const calendarEl = this.template.querySelector('div.fullcalendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: false,
            initialDate: new Date(),
            showNonCurrentDates: false,
            fixedWeekCount: false,
            allDaySlot: false,
            navLinks: false,
            events: this.events.map(event => ({
                ...event,
                color: this.holidayColors[generateUniqueKey(event.start, event.end)] // Assign color based on the mapping
            })),
            eventClick: (info) => {
                // Capture the employee name and leave type
                this.employeeName = info.event.id || 'Unknown Employee';
                this.leaveType = info.event.title || 'Leave Type Unknown';
                this.isModalOpen = true; // Open the modal
            }
        });
        calendar.render();
        calendar.setOption('contentHeight', 550);
        this.calendarTitle = calendar.view.title;
        this.calendar = calendar;
    }

    // Handle opening the modal
    handleOpenModal() {
        this.isModalOpen = true;
    }

    // Handle closing the modal
    handleCloseModal() {
        this.isModalOpen = false;
    }

    // Handle the creation of new holidays and add them to the calendar
    handleCreateHoliday(event) {
        const holidayData = event.detail;

        const newEvent = {
      //      id: holidayData.id, // Generate unique ID
            id: this.events.length + 1, // Generate unique ID
            title: holidayData.title,
            start: holidayData.start,
            end: holidayData.end
        };

        // Add the new event to the events array
        this.events = [...this.events, newEvent];

        // Dynamically add the new event to the calendar
        this.calendar.addEvent(newEvent);
        this.calendar.render();
    }

      handleApply() {
        // Open the modal
       this.isModalOpen = true;  
      }

        handleOpenModal() {
        this.isModalOpen = true; // Open the modal  
        const modal = this.template.querySelector('c-holiday-modal').isModalOpen = true;
    }
    

    // This will handle closing the modal
    handleCloseModal() {
        this.isModalOpen = false;
    }
    

// // Open Holiday Modal
 handleOpenHolidayModal() {
  this.isHolidayModalOpen = true;
 this.isLeaveDetailsModalOpen = false; // Close Leave Details Modal
}

    // // Close Holiday Modal
    handleCloseHolidayModal() {
       this.isHolidayModalOpen = false;
    }

    // Open Leave Details Modal
    handleOpenLeaveDetailsModal(employeeName, leaveType) {
        this.employeeName = employeeName;
        this.leaveType = leaveType;
        this.isLeaveDetailsModalOpen = true;
        this.isModalOpen = false; // Close Holiday Modal
    }

    // Close Leave Details Modal
    handleCloseLeaveDetailsModal() {
        this.isLeaveDetailsModalOpen = false;
    }

    // Handle calendar event click
    handleEventClick(info) {
        const employeeName = info.event.title; // Assuming title is employee name
        const leaveType = info.event.extendedProps.type; // Leave type
        this.handleOpenLeaveDetailsModal(employeeName, leaveType);
    }
}

