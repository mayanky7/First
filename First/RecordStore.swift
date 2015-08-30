//
//  RecordStore.swift
//  First
//
//  Created by Mayank Yadav on 29/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import UIKit
import CloudKit

class RecordStore {

    func createRecords() {

        //Create the record
        let activityRecord = CKRecord(recordType: "Activity")

        //Fetch the fitness steps
        activityRecord["steps"] = 10

        //Save the record
        let container = CKContainer.defaultContainer()

        //Public database ? 
        let database = container.publicCloudDatabase

        database.saveRecord(activityRecord) { (record, error) -> Void in

            if let constRecord = record {
                print(constRecord)
            }
        }
    }
}