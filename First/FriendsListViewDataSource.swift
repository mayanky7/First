//
//  FriendsListViewDataSource.swift
//  First
//
//  Created by Mayank Yadav on 04/10/15.
//  Copyright © 2015 First. All rights reserved.
//

import UIKit
import HealthKit

class FriendsListViewDataSource: NSObject, UITableViewDataSource {

    var stepCount = 0.0
    var tableView: UITableView;

    init(tableView: UITableView) {
        self.tableView = tableView;
        self.tableView.registerClass(UITableViewCell.classForCoder(), forCellReuseIdentifier: "cell");
        super.init();
        requestAccessAndUpdateStepCount()
    }

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return 1;
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell:UITableViewCell = tableView.dequeueReusableCellWithIdentifier("cell")!
        cell.textLabel?.text = "\(stepCount)"
        return cell;
    }

    func requestAccessAndUpdateStepCount() {
        let authenticator = Authenticator()
        authenticator.requestPermissions { (success) -> Void in
            print("Permissions status success ? \(success)")
            if success {
                let store = ActivityStore(healthKitStore: HKHealthStore())
                self.updateSteps(store)
            }
        }
    }

    func updateSteps(store:ActivityStore) {
        store.fetchStepCount({ (steps, error) -> Void in
            if let steps = steps {
                self.stepCount = steps
                self.tableView.reloadData()
            }
        })
    }
}