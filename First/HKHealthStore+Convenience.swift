import UIKit
import HealthKit;

extension HKHealthStore {

    func sampleCountOfType(sampleType: HKQuantityType, predicate: NSPredicate?, completion: (Double?, NSError?) -> Void) {

        let sumOptions = HKStatisticsOptions.CumulativeSum;

        let statQuery = HKStatisticsQuery(quantityType: sampleType, quantitySamplePredicate: predicate, options: sumOptions) { (statQuery, result, error) -> Void in

            if let constError = error {
                print(constError)
            }

            let sumQuantity = result?.sumQuantity()
            let unit = HKUnit.countUnit()
            let sum = sumQuantity?.doubleValueForUnit(unit)
            completion(sum, error)
        }

        self.executeQuery(statQuery)

    }

    func fetchTodayStepCount(completion:(Double, NSError?) -> Void) {

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

        self.sampleCountOfType(sampleType!, predicate: predicate) { (sum, error) -> Void in
            if error == nil {
                if let sum = sum {
                    completion(sum, nil)
                }
            } else {
                completion(0, error)
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