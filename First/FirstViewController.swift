import UIKit
import HealthKit

class FirstViewController: UIViewController, UITableViewDataSource {

    let healthStore = HKHealthStore();
    var stepCount = 0.0

    @IBOutlet weak var tableView: UITableView!;

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: NSBundle?) {
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil);
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        requestAccess()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    //User Interface Stuff
    func setupUI() {
        self.tableView.registerClass(UITableViewCell.classForCoder(), forCellReuseIdentifier: "cell");
        self.tableView.dataSource = self;
    }

    //Table View Delegate
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {

        return 1;
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {

        let cell:UITableViewCell = tableView.dequeueReusableCellWithIdentifier("cell")!
        cell.textLabel?.text = "Today's step count is \(self.stepCount)"

        return cell;
    }

    //Health Kit Stuff

    func fetchTodayStepCount() {

        let now = NSDate()

        let calendar = NSCalendar.currentCalendar()

        let calendarUnit = NSCalendarUnit.Year.union(NSCalendarUnit.Day).union(NSCalendarUnit.Month);
        let components = calendar.components(calendarUnit, fromDate: now)
        let todayBegining = calendar.dateFromComponents(components);

        let endDayComponents = calendar.components(calendarUnit, fromDate: now)
        endDayComponents.hour = 23
        endDayComponents.minute = 59
        endDayComponents.second = 59

        let todayEnd = calendar.dateFromComponents(endDayComponents)

        let startDate = todayBegining
        let endDate = todayEnd

        let predicate :NSPredicate? = HKStatisticsQuery.predicateForSamplesWithStartDate(startDate, endDate: endDate, options: HKQueryOptions.None)

        let sampleType = HKQuantityType.quantityTypeForIdentifier(HKQuantityTypeIdentifierStepCount)

        self.healthStore.sampleCountOfType(sampleType!, predicate: predicate) { (sum, error) -> Void in
            if error == nil {
                if let constSum = sum {
                    self.stepCount = constSum;
                    self.tableView.reloadData()
                }
            }
        }
    }

    func requestAccess() {

        let dataTypes = dataTypesToRead();

        self.healthStore.requestAuthorizationToShareTypes(Set(), readTypes: dataTypes)
            { (Bool success, NSError error) -> Void in
                if success {
                    print("It was a sucess");
                    self.fetchTodayStepCount()
                }
        }
    }

    func dataTypesToRead() -> Set <HKObjectType> {

        let quantityType = HKObjectType.quantityTypeForIdentifier(HKQuantityTypeIdentifierStepCount);
        var dataTypes = Set<HKObjectType>();
        dataTypes.insert(quantityType!);
        
        return dataTypes;
    }
}