import UIKit
import HealthKit;

extension HKHealthStore {

    func sampleCountOfType(sampleType: HKQuantityType, predicate: NSPredicate?, completion: (Double, NSError?) -> Void) {

        let sumOptions = HKStatisticsOptions.CumulativeSum;

        let statQuery = HKStatisticsQuery(quantityType: sampleType, quantitySamplePredicate: predicate, options: sumOptions) { (statQuery, result, error) -> Void in

            if let constError = error {
                print(constError)
            }

            let sumQuantity = result?.sumQuantity()
            let unit = HKUnit.countUnit()
            let sum = sumQuantity?.doubleValueForUnit(unit)
            completion(sum!, error)
        }

        self.executeQuery(statQuery)

    }
}
