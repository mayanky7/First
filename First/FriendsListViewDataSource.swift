//
//  FriendsListViewDataSource.swift
//  First
//
//  Created by Mayank Yadav on 04/10/15.
//  Copyright © 2015 First. All rights reserved.
//

import UIKit
import HealthKit
import Contacts

class FriendsListViewDataSource: NSObject, UITableViewDataSource {

    var tableView: UITableView
    var contacts = [Person]()
    var person: Person? = nil;

    init(tableView: UITableView) {

        self.tableView = tableView;
        super.init();
        startFetchingData();
    }

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return contacts.count;
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {

        let cellIdentifier = "cell"
        var cell = tableView.dequeueReusableCellWithIdentifier(cellIdentifier)
        if (cell == nil) {
            cell = UITableViewCell(style: UITableViewCellStyle.Value1, reuseIdentifier: cellIdentifier)
        }

        let constCell = cell!
        let contact = self.contacts[indexPath.row]
        constCell.textLabel?.text = contact.name
        print("Cell Steps \(contact.steps)")
        constCell.detailTextLabel?.text = "\(contact.steps)"

        return constCell;
    }

    private func startFetchingData() {

        Authenticator().requestPermissions { (success) -> Void in
            if success {
                let store = ActivityStore(healthKitStore: HKHealthStore())
                self.updateSteps(store)
                self.fetchFriendList(store)
            } else {
                print("Failed to get permissions")
            }
        }
    }

    private func updateSteps(store:ActivityStore) {

        store.fetchStepCount({ (steps, error) -> Void in
            if let steps = steps {
                self.updatePersonStepCount(steps)
                self.tableView.reloadData()
            }
        })
    }

    private func fetchFriendList(store: ActivityStore) {

        store.fetchFriends { (fetchedContacts) -> Void in
            if let fetchedContacts = fetchedContacts {
                self.updateContactFriends(fetchedContacts)
            }
        }
    }

    private func updateContactFriends(friends: [CNContact]) {

       let persons = friends.map { (let contact) -> Person in
            let identifier = NSUUID().UUIDString
            let friend = Person(userName: contact.givenName, userSteps: 2, userIdentifier: identifier)
            return friend
        }

        self.contacts.appendContentsOf(persons)
        self.tableView.reloadData()
    }

    private func updatePersonStepCount(stepCount: Double) {

        assert(person == nil)
        let personIdentifier = NSUUID()
        person = Person(userName: "Self", userSteps: stepCount, userIdentifier: personIdentifier.UUIDString)
        contacts.append(person!)
        self.tableView.reloadData()
    }
}