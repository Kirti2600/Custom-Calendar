public with sharing class CustomCalendarController
     {
 @AuraEnabled(cacheable=true)
    public static List<User_Holiday__C> getLeavesData()
     {
        List<User_Holiday__c> holidayList = [SELECT ID, Name, End_Date__c, Start_Date__c, Type__c
                                          FROM User_Holiday__c];
        
        return holidayList;
    }
}